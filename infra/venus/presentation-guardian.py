"""Trusted PID1 coordinator. Never imports Poppler or parses PDF/PNG content.

ADR042: root only SETUID/SETGID/KILL in a private PID namespace. Each parser
and cleanup helper irreversibly drops to its designated UID with no caps.
Successful output is acknowledged only after namespace-wide kill/reap and
trusted cleanup. No Docker API, network, secrets or database credentials.
"""
import ctypes
import hashlib
import json
import os
import re
import resource
import selectors
import signal
import stat
import subprocess
import sys
import time
import uuid

SPOOL = "/run/venus-presentations/spool"
SCRATCH = "/run/venus-presentations/scratch"
SCRIPT = "/app/infra/venus/presentation-guardian.py"
RENDERER = "/app/infra/venus/presentation-render.py"
UUID = re.compile(r"^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$")
HEX = re.compile(r"^[a-f0-9]{64}$")
MAX_SOURCE = 16 * 1024 * 1024
MAX_PAGE = 4 * 1024 * 1024
MAX_OUTPUT = 64 * 1024 * 1024
MAX_LOG = 256 * 1024
ID_KEYS = ("job_id", "nonce", "api_epoch", "guardian_epoch")


class Closed(Exception):
    pass


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def write_all(fd, data):
    remaining = memoryview(data)
    while remaining:
        written = os.write(fd, remaining)
        if written <= 0:
            raise Closed("GUARDIAN_WRITE_FAILED")
        remaining = remaining[written:]


def dropped(uid):
    """Called in a freshly forked trusted child before exec, never in PID1."""
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    resource.setrlimit(resource.RLIMIT_CPU, (90, 90))
    resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_SOURCE, MAX_SOURCE))
    os.setgroups([])
    os.setresgid(uid, uid, uid)
    os.setresuid(uid, uid, uid)
    libc = ctypes.CDLL(None, use_errno=True)
    # no_new_privs inherited from Compose, repeated to make direct exec fail-safe.
    if libc.prctl(38, 1, 0, 0, 0) != 0:
        os._exit(120)
    class Header(ctypes.Structure):
        _fields_ = [("version", ctypes.c_uint32), ("pid", ctypes.c_int)]
    class Data(ctypes.Structure):
        _fields_ = [("effective", ctypes.c_uint32), ("permitted", ctypes.c_uint32),
                    ("inheritable", ctypes.c_uint32)]
    header, data = Header(0x20080522, 0), (Data * 2)()
    if libc.capset(ctypes.byref(header), ctypes.byref(data)) != 0:
        os._exit(121)
    # CLEAR_ALL ambient capabilities, then verify identity and /proc caps.
    libc.prctl(47, 4, 0, 0, 0)
    if os.getuid() != uid or os.geteuid() != uid or os.getgroups():
        os._exit(122)


def atomic_json(name, value):
    data = json.dumps(value, separators=(",", ":")).encode()
    if len(data) > 65536:
        raise Closed("GUARDIAN_METADATA_LIMIT")
    temp = os.path.join(SPOOL, ".guardian-" + str(uuid.uuid4()))
    fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o444)
    try:
        write_all(fd, data)
        os.fsync(fd)
    finally:
        os.close(fd)
    os.replace(temp, os.path.join(SPOOL, name))
    # Root owns these transient files even in API-owned sticky1777 directory.
    # A previous crash may leave one; the cleanup helper preserves an in-flight
    # heartbeat temporary, while this sole trusted writer removes stale ones.
    for entry in os.listdir(SPOOL):
        if entry.startswith(".guardian-"):
            path = os.path.join(SPOOL, entry)
            info = os.lstat(path)
            if info.st_uid == 0 and stat.S_ISREG(info.st_mode) and info.st_nlink == 1:
                os.unlink(path)


def open_regular(path, uid, maximum, mode=None):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    info = os.fstat(fd)
    if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != uid or
            info.st_size > maximum or (mode is not None and stat.S_IMODE(info.st_mode) != mode)):
        os.close(fd)
        raise Closed("GUARDIAN_UNSAFE_FILE")
    return fd, info


def read_json(path, uid=1000, maximum=4096, mode=0o444):
    fd, _ = open_regular(path, uid, maximum, mode)
    try:
        data = os.read(fd, maximum + 1)
        if len(data) > maximum:
            raise Closed("GUARDIAN_METADATA_LIMIT")
        value = json.loads(data)
        if not isinstance(value, dict):
            raise Closed("GUARDIAN_METADATA_INVALID")
        return value
    finally:
        os.close(fd)


def same_identity(value, job):
    return (set(value) == {"schema_version", *ID_KEYS} and value["schema_version"] == 1 and
            all(value.get(key) == job[key] for key in ID_KEYS))


def control(name, job):
    try:
        return same_identity(read_json(os.path.join(SPOOL, name)), job)
    except FileNotFoundError:
        return False


def kill_and_reap():
    # Unlike killpg, covers double-fork/setsid. PID1 must never be a host PID1.
    try:
        os.kill(-1, signal.SIGKILL)
    except ProcessLookupError:
        pass
    deadline = time.monotonic() + 5
    while True:
        try:
            pid, _ = os.waitpid(-1, os.WNOHANG)
            if pid:
                continue
        except ChildProcessError:
            # No unreaped descendant may retain a read of future plaintext.
            remaining = [name for name in os.listdir("/proc") if name.isdigit() and int(name) != 1]
            if not remaining:
                return
        if time.monotonic() >= deadline:
            raise Closed("GUARDIAN_DESCENDANT_SURVIVED")
        try:
            os.kill(-1, signal.SIGKILL)
        except ProcessLookupError:
            pass
        time.sleep(0.01)


def clean_tree(path, owner, preserve=(), child_entries_only=False):
    """Trusted UID cleanup after hostile namespace occupants are gone.

    Does not follow links/open FIFO/devices. Owner can restore chmod000 dirs;
    API UID owns1777 spool so it can unlink root outputs. Fixed bounded inode
    and depth limits make a malicious tree a closed worker, not a hang.
    """
    budget = [2048]
    failures = []
    root_stat = os.lstat(path)
    if not stat.S_ISDIR(root_stat.st_mode) or root_stat.st_uid != (1000 if child_entries_only else owner):
        raise Closed("GUARDIAN_CLEANUP_OWNER")
    if not child_entries_only:
        os.chmod(path, 0o1777 if path == SPOOL else 0o700)

    def walk(directory, depth):
        if depth > 32:
            raise Closed("GUARDIAN_CLEANUP_DEPTH")
        for name in os.listdir(directory):
            if depth == 0 and name in preserve:
                continue
            budget[0] -= 1
            if budget[0] < 0:
                raise Closed("GUARDIAN_CLEANUP_LIMIT")
            entry = os.path.join(directory, name)
            try:
                info = os.lstat(entry)
            except FileNotFoundError:
                # Atomic heartbeat rename may remove its own temporary name.
                continue
            if depth == 0 and path == SPOOL and name.startswith(".guardian-") and info.st_uid == 0:
                continue
            if depth == 0 and child_entries_only and info.st_uid != owner:
                continue
            if stat.S_ISDIR(info.st_mode):
                if info.st_uid != owner:
                    failures.append("GUARDIAN_CLEANUP_OWNER")
                    continue
                try:
                    os.chmod(entry, 0o700, follow_symlinks=False)
                    walk(entry, depth + 1)
                    os.rmdir(entry)
                except (OSError, Closed):
                    failures.append("GUARDIAN_CLEANUP_FAILED")
            else:
                try:
                    os.unlink(entry)
                except OSError:
                    failures.append("GUARDIAN_CLEANUP_FAILED")
    walk(path, 0)
    if failures:
        raise Closed(failures[0])


def normalize_output():
    if os.lstat(SCRATCH).st_uid != 65534:
        raise Closed("GUARDIAN_CLEANUP_OWNER")
    os.chmod(SCRATCH, 0o755)
    for name in ["render-result.json"] + [f"page-{i}.png" for i in range(100)]:
        path = os.path.join(SCRATCH, name)
        try:
            info = os.lstat(path)
        except FileNotFoundError:
            continue
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != 65534:
            raise Closed("GUARDIAN_UNSAFE_FILE")
        os.chmod(path, 0o644, follow_symlinks=False)


def helper(action, uid, preserve=(), heartbeat=None):
    child = subprocess.Popen(["/usr/bin/python3", "-I", "-B", SCRIPT, action, *preserve],
                            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL, close_fds=True,
                            env={"LANG": "C", "PATH": "/usr/bin:/bin"},
                            preexec_fn=lambda: dropped(uid))
    deadline = time.monotonic() + 8
    while child.poll() is None:
        if heartbeat:
            heartbeat()
        if time.monotonic() >= deadline:
            child.kill()
            child.wait()
            raise Closed("GUARDIAN_CLEANUP_TIMEOUT")
        time.sleep(0.05)
    if child.returncode != 0:
        raise Closed("GUARDIAN_CLEANUP_FAILED")


class Guardian:
    def __init__(self):
        if os.getpid() != 1 or os.getuid() != 0:
            raise Closed("GUARDIAN_PRIVATE_PID1_REQUIRED")
        # Validate exact mount paths/owners before any destructive namespace operation.
        for path, uid, mode in [(SPOOL, 1000, 0o1777), (SCRATCH, 65534, 0o700)]:
            info = os.lstat(path)
            if not stat.S_ISDIR(info.st_mode) or info.st_uid != uid or stat.S_IMODE(info.st_mode) != mode:
                raise Closed("GUARDIAN_MOUNT_INVALID")
        status = open("/proc/self/status", encoding="ascii").read()
        # SETGID6, SETUID7, KILL5 only. Reject host/shared PID namespace configuration.
        for name in ("CapEff", "CapPrm"):
            if int(re.search(rf"^{name}:\s+([0-9a-f]+)", status, re.M)[1], 16) != 0xE0:
                raise Closed("GUARDIAN_CAPABILITIES_INVALID")
        if not re.search(r"^NoNewPrivs:\s+1$", status, re.M):
            raise Closed("GUARDIAN_PRIVILEGE_POLICY")
        self.epoch = str(uuid.uuid4())
        self.job = None
        self.state = "closed"
        self.last_health = 0

    def health(self, force=False):
        if force or time.monotonic() - self.last_health >= 0.5:
            atomic_json("health.json", {"schema_version": 1, "guardian_epoch": self.epoch,
                         "state": self.state, "job_id": self.job["job_id"] if self.job else None,
                         "api_epoch": self.job["api_epoch"] if self.job else None,
                         "nonce": self.job["nonce"] if self.job else None, "updated_at": now()})
            self.last_health = time.monotonic()

    def cleanup(self):
        kill_and_reap()
        failures = []
        heartbeat = self.health if self.state != "closed" else None
        for action, uid, preserve in [("--clean-scratch", 65534, ()),
                                      ("--clean-spool-child", 65534, ()),
                                      ("--clean-spool", 1000, ("health.json",))]:
            try:
                helper(action, uid, preserve, heartbeat=heartbeat)
            except BaseException as error:
                failures.append(error)
        kill_and_reap()
        if failures:
            raise Closed("GUARDIAN_CLEANUP_FAILED")

    def request(self):
        try:
            value = read_json(os.path.join(SPOOL, "request.json"))
        except FileNotFoundError:
            return None
        keys = {"schema_version", *ID_KEYS, "source_bytes", "source_sha256", "output_budget_bytes"}
        if (set(value) != keys or value.get("schema_version") != 1 or
                any(not isinstance(value.get(key), str) or not UUID.fullmatch(value[key]) for key in ID_KEYS) or
                value["guardian_epoch"] != self.epoch or
                type(value.get("source_bytes")) is not int or not 1 <= value["source_bytes"] <= MAX_SOURCE or
                not isinstance(value.get("source_sha256"), str) or not HEX.fullmatch(value["source_sha256"]) or
                type(value.get("output_budget_bytes")) is not int or not 1 <= value["output_budget_bytes"] <= MAX_OUTPUT):
            raise Closed("GUARDIAN_REQUEST_INVALID")
        return value

    def render(self, job):
        job_deadline = time.monotonic() + 120
        source_fd, info = open_regular(os.path.join(SPOOL, "source.pdf"), 1000, MAX_SOURCE, 0o444)
        try:
            if info.st_size != job["source_bytes"]:
                raise Closed("GUARDIAN_SOURCE_SIZE")
            digest = hashlib.sha256()
            while chunk := os.read(source_fd, 65536):
                digest.update(chunk)
            if digest.hexdigest() != job["source_sha256"]:
                raise Closed("GUARDIAN_SOURCE_DIGEST")
            os.lseek(source_fd, 0, os.SEEK_SET)
            # Leave space for source, control files and manifest on64MiB shared spool.
            budget = min(job["output_budget_bytes"], MAX_OUTPUT - info.st_size - 131072)
            if budget < 1:
                raise Closed("GUARDIAN_OUTPUT_BUDGET")
            child = subprocess.Popen(["/usr/bin/python3", "-I", "-B", RENDERER, str(source_fd), str(budget)],
                        stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                        close_fds=True, pass_fds=(source_fd,), cwd="/app",
                        env={"PATH": "/usr/bin:/bin", "LANG": "C", "TMPDIR": SCRATCH},
                        preexec_fn=lambda: dropped(65534))
            diagnostics, reason = 0, None
            with selectors.DefaultSelector() as selector:
                selector.register(child.stdout, selectors.EVENT_READ)
                selector.register(child.stderr, selectors.EVENT_READ)
                while child.poll() is None or selector.get_map():
                    self.health()
                    if control("cancel.json", job):
                        reason = "PDF_CANCELLED"
                        break
                    if time.monotonic() >= job_deadline:
                        reason = "PDF_TIMEOUT"
                        break
                    for key, _ in selector.select(0.05):
                        chunk = os.read(key.fileobj.fileno(), 8192)
                        if not chunk:
                            selector.unregister(key.fileobj)
                            key.fileobj.close()
                        diagnostics += len(chunk)
                        if diagnostics > MAX_LOG:
                            reason = "PDF_DIAGNOSTIC_LIMIT"
                            break
                    if reason:
                        break
            kill_and_reap()
            if reason:
                return {"status": "cancelled" if reason == "PDF_CANCELLED" else "failed",
                        "error": reason, "pages": [], "total_bytes": 0}
            helper("--normalize-output", 65534, heartbeat=self.health)
            helper("--clean-spool-child", 65534, heartbeat=self.health)
            result = read_json(os.path.join(SCRATCH, "render-result.json"), 65534, 32768, 0o644)
            if set(result) != {"status", "error", "pages", "total_bytes"}:
                raise Closed("GUARDIAN_RESULT_INVALID")
            if result["status"] == "failed":
                allowed = {"PDF_INVALID", "PDF_PAGE_LIMIT", "PDF_GEOMETRY", "PDF_OUTPUT_LIMIT",
                           "PDF_OUTPUT_INVALID", "PDF_TIMEOUT", "PDF_DIAGNOSTIC_LIMIT", "PDF_RENDER_FAILED"}
                if result["error"] not in allowed or result["pages"] != [] or result["total_bytes"] != 0:
                    raise Closed("GUARDIAN_RESULT_INVALID")
                return result
            if (result["status"] != "ready" or result["error"] is not None or
                    not isinstance(result["pages"], list) or not 1 <= len(result["pages"]) <= 100):
                raise Closed("GUARDIAN_RESULT_INVALID")
            total = 0
            for index, page in enumerate(result["pages"]):
                self.health()
                if time.monotonic() >= job_deadline:
                    raise Closed("GUARDIAN_JOB_TIMEOUT")
                if (not isinstance(page, dict) or set(page) != {"index", "file", "bytes", "sha256", "width", "height"} or
                        page["index"] != index or page["file"] != f"page-{index}.png" or
                        any(type(page.get(key)) is not int for key in ("index", "bytes", "width", "height")) or
                        not 24 <= page["bytes"] <= MAX_PAGE or not isinstance(page["sha256"], str) or
                        not HEX.fullmatch(page["sha256"]) or not 1 <= page["width"] <= 8192 or
                        not 1 <= page["height"] <= 8192 or page["width"] * page["height"] > 8_000_000):
                    raise Closed("GUARDIAN_RESULT_INVALID")
                total += page["bytes"]
                if total > budget:
                    raise Closed("GUARDIAN_OUTPUT_BUDGET")
                fd, metadata = open_regular(os.path.join(SCRATCH, page["file"]), 65534, MAX_PAGE, 0o644)
                target = os.open(os.path.join(SPOOL, page["file"]), os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o444)
                digest = hashlib.sha256()
                try:
                    if metadata.st_size != page["bytes"]:
                        raise Closed("GUARDIAN_RESULT_INVALID")
                    while chunk := os.read(fd, 65536):
                        digest.update(chunk)
                        write_all(target, chunk)
                    os.fsync(target)
                finally:
                    os.close(fd)
                    os.close(target)
                if digest.hexdigest() != page["sha256"]:
                    raise Closed("GUARDIAN_RESULT_DIGEST")
            if type(result["total_bytes"]) is not int or result["total_bytes"] != total:
                raise Closed("GUARDIAN_RESULT_INVALID")
            return result
        finally:
            os.close(source_fd)

    def run(self):
        self.cleanup()
        self.state = "idle"
        self.health(True)
        while True:
            self.health()
            job = self.request()
            if not job:
                time.sleep(0.05)
                continue
            self.job, self.state = job, "busy"
            self.health(True)
            result = self.render(job)
            kill_and_reap()
            helper("--clean-scratch", 65534, heartbeat=self.health)
            helper("--clean-spool-child", 65534, heartbeat=self.health)
            cancelled = control("cancel.json", job)
            keep = ("health.json",) + tuple(page["file"] for page in result["pages"])
            helper("--clean-spool", 1000, keep, heartbeat=self.health)
            kill_and_reap()
            if cancelled:
                result = {"status": "cancelled", "error": "PDF_CANCELLED", "pages": [], "total_bytes": 0}
            atomic_json("result.json", {"schema_version": 1, **{key: job[key] for key in ID_KEYS}, **result})
            ack_deadline = time.monotonic() + 60
            while not control("ack.json", job):
                self.health()
                if time.monotonic() >= ack_deadline:
                    raise Closed("GUARDIAN_ACK_TIMEOUT")
                time.sleep(0.05)
            self.cleanup()
            self.job, self.state = None, "idle"
            self.health(True)


if __name__ == "__main__":
    # Helpers are trusted scripts, invoked only after the renderer namespace is reaped.
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        if action in ("--clean-scratch", "--normalize-output", "--clean-spool-child"):
            if os.getuid() != 65534 or os.getgroups():
                raise Closed("GUARDIAN_HELPER_IDENTITY")
            if action == "--clean-scratch":
                clean_tree(SCRATCH, 65534)
            elif action == "--clean-spool-child":
                clean_tree(SPOOL, 65534, child_entries_only=True)
            else:
                normalize_output()
        elif action == "--clean-spool":
            if os.getuid() != 1000 or os.getgroups():
                raise Closed("GUARDIAN_HELPER_IDENTITY")
            clean_tree(SPOOL, 1000, sys.argv[2:])
        elif action:
            raise Closed("GUARDIAN_ARGUMENTS")
        else:
            guardian = Guardian()
            # PID1 does not delegate the trusted control loop to a same-UID child.
            def stop(_signum, _frame):
                raise Closed("GUARDIAN_STOPPED")
            signal.signal(signal.SIGTERM, stop)
            signal.signal(signal.SIGINT, stop)
            try:
                guardian.run()
            finally:
                guardian.state = "closed"
                try:
                    guardian.cleanup()
                    guardian.health(True)
                except BaseException:
                    pass
    except BaseException:
        # No parser diagnostics, source bytes, names or private paths in logs.
        sys.stderr.write("PRESENTATION_CONVERTER_CLOSED\n")
        sys.exit(1)
