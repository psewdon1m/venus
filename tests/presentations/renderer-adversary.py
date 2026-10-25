"""Host-controlled hostile-process probe for the actual isolated converter.

Not a product API or standalone PASS. The existing host runner may dockerexec
this test-only file as65534 during an actual PDF job, retain its stdout and
verify guardian cleanup before the next document. Production image excludes
tests. It never targets host processes, networks or real private data.
"""
import errno
import json
import os
import signal
import stat
import time

SCRATCH = "/run/venus-presentations/scratch"
SPOOL = "/run/venus-presentations/spool"

if os.getuid() != 65534 or os.getpid() == 1:
    raise SystemExit("isolated renderer UID required")

status = open("/proc/self/status", encoding="ascii").read()
caps = {line.split(":", 1)[0]: line.split(":", 1)[1].strip()
        for line in status.splitlines() if line.startswith(("CapEff:", "CapPrm:", "CapAmb:", "NoNewPrivs:"))}
signals = {}
for name in ("SIGTERM", "SIGKILL", "SIGSTOP"):
    try:
        os.kill(1, getattr(signal, name))
        signals[name] = "UNEXPECTED_PERMISSION"
    except PermissionError as error:
        signals[name] = "EPERM" if error.errno == errno.EPERM else "DENIED"

secret_paths = ["/run/secrets/db_password", "/run/secrets/keyring", "/run/secrets/media_key",
                "/var/lib/venus-protected/presentations/authority/authority.json", "/var/run/docker.sock"]
visible = [name for name in secret_paths if os.path.lexists(name)]
pid = os.fork()
if pid == 0:
    os.setsid()
    nested = os.fork()
    if nested:
        os._exit(0)
    # Do not keep dockerexec stdout/stderr pipes alive after the probe parent exits.
    for descriptor in (0, 1, 2):
        try:
            os.close(descriptor)
        except OSError:
            pass
    # Exercise owner-only inaccessible directories, symlink and FIFO cleanup.
    junk = os.path.join(SCRATCH, "adversary-junk")
    os.mkdir(junk, 0o700)
    os.symlink("/etc/passwd", os.path.join(junk, "link"))
    os.mkfifo(os.path.join(junk, "fifo"), 0o600)
    with open(os.path.join(junk, "junk"), "wb") as stream:
        stream.write(b"fixture-only")
    os.chmod(junk, 0)
    spool_junk = os.path.join(SPOOL, "adversary-junk")
    os.mkdir(spool_junk, 0o700)
    os.mkfifo(os.path.join(spool_junk, "fifo"), 0o600)
    os.chmod(spool_junk, 0)
    # Parent runner must observe this orphan gone after the guarded real job.
    while True:
        time.sleep(0.05)
os.waitpid(pid, 0)
print(json.dumps({"probe": "host-controlled-adversary", "caps": caps, "guardian_signals": signals,
                  "forbidden_paths_visible": visible, "spool_owner": os.stat(SPOOL).st_uid,
                  "spool_mode": oct(stat.S_IMODE(os.stat(SPOOL).st_mode))), flush=True)
