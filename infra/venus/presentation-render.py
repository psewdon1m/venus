"""Bounded adaptation of Preza render_pdf, not a new document-format converter.

Source: preza aeca0de85a54ca8c30ff9c7143f9352fdddfdecf,
api/app/storage.py:render_pdf. Retains pdfinfo -> pdftoppm PNG rendering;
Venus adds incremental pages, geometry/output/clock/process limits. This
program is untrusted from the guardian's perspective and runs as UID65534.
"""
import hashlib
import json
import math
import os
import re
import resource
import selectors
import stat
import struct
import subprocess
import sys
import time

DPI = 120
MAX_PAGES = 100
MAX_SIDE = 8192
MAX_PIXELS = 8_000_000
MAX_PAGE_BYTES = 4 * 1024 * 1024
MAX_OUTPUT = 64 * 1024 * 1024
MAX_DIAGNOSTICS = 256 * 1024
SCRATCH = "/run/venus-presentations/scratch"


class Rejected(Exception):
    pass


def render_pdf(source_fd, output_budget):
    """Same Poppler renderer as the pinned owner source; fixed PDF-only profile."""
    started = time.monotonic()
    diagnostics = 0
    source = f"/proc/self/fd/{source_fd}"
    os.lseek(source_fd, 0, os.SEEK_SET)
    if b"%PDF-" not in os.read(source_fd, 1024):
        raise Rejected("PDF_INVALID")
    os.lseek(source_fd, 0, os.SEEK_SET)

    def command(args, deadline, file_limit):
        nonlocal diagnostics

        def limit_file():
            resource.setrlimit(resource.RLIMIT_FSIZE, (file_limit, file_limit))

        child = subprocess.Popen(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE, close_fds=True,
                                 pass_fds=(source_fd,), preexec_fn=limit_file,
                                 env={"PATH": "/usr/bin:/bin", "LANG": "C", "LC_ALL": "C",
                                      "HOME": SCRATCH, "TMPDIR": SCRATCH})
        output = bytearray()
        with selectors.DefaultSelector() as selector:
            selector.register(child.stdout, selectors.EVENT_READ, True)
            selector.register(child.stderr, selectors.EVENT_READ, False)
            try:
                while selector.get_map():
                    if time.monotonic() >= deadline:
                        raise Rejected("PDF_TIMEOUT")
                    for key, _ in selector.select(0.05):
                        chunk = os.read(key.fileobj.fileno(), 8192)
                        if not chunk:
                            selector.unregister(key.fileobj)
                            key.fileobj.close()
                            continue
                        diagnostics += len(chunk)
                        if diagnostics > MAX_DIAGNOSTICS:
                            raise Rejected("PDF_DIAGNOSTIC_LIMIT")
                        if key.data:
                            output.extend(chunk)
                remaining = deadline - time.monotonic()
                if remaining <= 0 or child.wait(timeout=remaining) != 0:
                    raise Rejected("PDF_RENDER_FAILED")
            finally:
                if child.poll() is None:
                    child.kill()
                child.wait()
        return output.decode("ascii", "replace")

    metadata_deadline = started + 30
    info = command(["/usr/bin/pdfinfo", source], metadata_deadline, 16 * 1024 * 1024)
    match = re.search(r"^Pages:\s+(\d+)\s*$", info, re.M)
    if not match or re.search(r"^Encrypted:\s+yes\b", info, re.M | re.I):
        raise Rejected("PDF_INVALID")
    pages = int(match.group(1))
    if not 1 <= pages <= MAX_PAGES:
        raise Rejected("PDF_PAGE_LIMIT")
    boxes = command(["/usr/bin/pdfinfo", "-f", "1", "-l", str(pages), source],
                    metadata_deadline, 16 * 1024 * 1024)
    sizes = re.findall(r"(?:Page\s+\d+\s+size|Page size):\s+([\d.eE+-]+)\s+x\s+([\d.eE+-]+)", boxes)
    if len(sizes) != pages:
        raise Rejected("PDF_GEOMETRY")
    for width, height in sizes:
        width, height = float(width) * DPI / 72, float(height) * DPI / 72
        if (not math.isfinite(width) or not math.isfinite(height) or
                min(width, height) <= 0 or max(width, height) > MAX_SIDE or
                math.ceil(width) * math.ceil(height) > MAX_PIXELS):
            raise Rejected("PDF_GEOMETRY")
    result = []
    total = 0
    for index in range(pages):
        name = f"page-{index}.png"
        prefix = os.path.join(SCRATCH, f"page-{index}")
        command(["/usr/bin/pdftoppm", "-f", str(index + 1), "-l", str(index + 1),
                 "-singlefile", "-png", "-r", str(DPI), source, prefix],
                started + 120, MAX_PAGE_BYTES)
        fd = os.open(os.path.join(SCRATCH, name), os.O_RDONLY | os.O_NOFOLLOW)
        try:
            metadata = os.fstat(fd)
            if (not stat.S_ISREG(metadata.st_mode) or metadata.st_nlink != 1 or
                    not 24 <= metadata.st_size <= MAX_PAGE_BYTES):
                raise Rejected("PDF_OUTPUT_LIMIT")
            header = os.read(fd, 24)
            if header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
                raise Rejected("PDF_OUTPUT_INVALID")
            width, height = struct.unpack(">II", header[16:24])
            if (min(width, height) < 1 or max(width, height) > MAX_SIDE or
                    width * height > MAX_PIXELS):
                raise Rejected("PDF_GEOMETRY")
            total += metadata.st_size
            if total > min(output_budget, MAX_OUTPUT):
                raise Rejected("PDF_OUTPUT_LIMIT")
            digest = hashlib.sha256(header)
            while chunk := os.read(fd, 65536):
                digest.update(chunk)
            result.append({"index": index, "file": name, "bytes": metadata.st_size,
                           "sha256": digest.hexdigest(), "width": width, "height": height})
        finally:
            os.close(fd)
    return {"pages": result, "total_bytes": total}


if __name__ == "__main__":
    # Never run the parser as guardian/root, even if directly invoked incorrectly.
    if os.getuid() != 65534 or os.getgid() != 65534 or os.getgroups():
        sys.exit(2)
    try:
        source_fd, budget = int(sys.argv[1]), int(sys.argv[2])
        if not 1 <= budget <= MAX_OUTPUT:
            raise Rejected("PDF_OUTPUT_LIMIT")
        payload = {"status": "ready", "error": None, **render_pdf(source_fd, budget)}
    except Rejected as error:
        payload = {"status": "failed", "error": str(error), "pages": [], "total_bytes": 0}
    except BaseException:
        payload = {"status": "failed", "error": "PDF_RENDER_FAILED", "pages": [], "total_bytes": 0}
    target = os.path.join(SCRATCH, "render-result.json")
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump(payload, stream, separators=(",", ":"))
        stream.flush()
        os.fsync(stream.fileno())
