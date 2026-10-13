"""
Admin Sync for the Adverzo Dispatch Console
===========================================

Lets the Middle Class Mediator admin website queue a personalised bulk
WhatsApp broadcast, and has THIS console send it with the same mouse /
keyboard automation it always uses.

How it fits together
--------------------
    Admin website  --queue-->  Google Sheet (Apps Script)  <--poll--  this console
                                                                         |
                                                              sends each message
                                                              through WhatsApp Web

* The console only reaches OUT to your Google Apps Script URL. Nothing on this
  PC is exposed to the internet, and no router / firewall changes are needed.
* Every message is sent through the exact same flow as a normal "numbers" run
  (search name -> paste number -> open chat -> paste text -> Enter).
* It respects the console's own safety features: the access key (it does
  nothing while the console is locked), the countdown + Skip, the F9
  double-press stop, and it will not start while another run is in progress.

Extra safety (all editable in data/admin_sync.json)
---------------------------------------------------
* daily_limit      - most messages sent per calendar day (default 60). The rest
                     of a big broadcast simply waits for tomorrow.
* allowed_hours    - only start sending inside this window, e.g. "09:00-20:00".
* countdown_seconds- warning (with beeps and a Skip button) before the mouse
                     starts moving.
* A person is marked "sending" BEFORE their message goes out. If the PC dies
  mid-message, that person is marked failed ("interrupted") and is NEVER sent a
  second time automatically, so nobody gets a duplicate.

"Sent" means the console completed its click-and-paste steps for that person.
It cannot see WhatsApp's delivery ticks, so check the WhatsApp chat if you need
proof for a particular number.

Check your setup any time with:   python admin_sync.py check
"""

import json
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "data"
CONFIG_FILE = DATA_DIR / "admin_sync.json"
STATE_FILE = DATA_DIR / "admin_sync_state.json"

DEFAULT_CONFIG = {
    "enabled": False,
    "apps_script_url": "",
    "agent_key": "",
    "agent_id": "",
    "poll_seconds": 15,
    "countdown_seconds": 30,
    "daily_limit": 60,
    "allowed_hours": "00:00-23:59",
}

_config_lock = threading.Lock()
_once_seen = {}


# ---------------------------------------------------------------- config / state

def _read_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def _write_json(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def load_config():
    with _config_lock:
        if not CONFIG_FILE.exists():
            cfg = dict(DEFAULT_CONFIG, agent_id=socket.gethostname())
            _write_json(CONFIG_FILE, cfg)
            return cfg
        cfg = dict(DEFAULT_CONFIG)
        cfg.update(_read_json(CONFIG_FILE, {}))
        if not cfg.get("agent_id"):
            cfg["agent_id"] = socket.gethostname()
        return cfg


def _today():
    return datetime.now().strftime("%Y-%m-%d")


def sent_today():
    state = _read_json(STATE_FILE, {})
    return int(state.get("sent", 0)) if state.get("date") == _today() else 0


def _bump_sent(n=1):
    _write_json(STATE_FILE, {"date": _today(), "sent": sent_today() + n})


def parse_hours(text):
    """"09:00-20:00" -> (540, 1200) minutes since midnight, or None if unreadable."""
    try:
        a, b = str(text).split("-")
        h1, m1 = a.strip().split(":")
        h2, m2 = b.strip().split(":")
        return int(h1) * 60 + int(m1), int(h2) * 60 + int(m2)
    except (ValueError, AttributeError):
        return None


def within_hours(cfg, now=None):
    win = parse_hours(cfg.get("allowed_hours"))
    if not win:
        return True
    now = now or datetime.now()
    minute = now.hour * 60 + now.minute
    start, end = win
    return start <= minute <= end if start <= end else (minute >= start or minute <= end)


# ---------------------------------------------------------------- talking to Google

def post(cfg, action, payload, timeout=45):
    """One call to the Apps Script web app. Same envelope the website uses."""
    body = json.dumps({"action": action, "payload": dict(payload, key=cfg["agent_key"])}).encode("utf-8")
    req = urllib.request.Request(
        cfg["apps_script_url"], data=body, method="POST",
        headers={"Content-Type": "text/plain;charset=utf-8"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        text = resp.read().decode("utf-8")
    try:
        out = json.loads(text)
    except ValueError:
        raise RuntimeError("Google did not return data - is the Apps Script deployed with access 'Anyone'?")
    if not out.get("ok"):
        raise RuntimeError(out.get("error") or "server error")
    return out.get("data")


def post_retry(cfg, action, payload, tries=3):
    """Network blips are normal (Google's redirect layer, wifi). Retry before giving up.
    A real answer from the server ({ok:false}) is never retried."""
    last = None
    for attempt in range(1, tries + 1):
        try:
            return post(cfg, action, payload)
        except RuntimeError:
            raise
        except (urllib.error.URLError, OSError, TimeoutError) as exc:
            last = exc
            time.sleep(attempt * 1.5)
    raise RuntimeError(f"network problem: {last}")


# ---------------------------------------------------------------- the agent

def _once(srv, key, text):
    """Log a message only when it changes, so the console window doesn't fill up."""
    if _once_seen.get(key) != text:
        _once_seen[key] = text
        srv.log(text)


def _digits10(phone):
    d = "".join(ch for ch in str(phone) if ch.isdigit())
    return d[-10:] if len(d) >= 10 else ""


def _heartbeat(srv, cfg, note):
    try:
        post_retry(cfg, "agentPoll", {"agentId": cfg["agent_id"], "peek": True, "note": note}, tries=1)
    except Exception as exc:
        _once(srv, "hb", f"Admin sync: cannot reach the admin queue ({exc})")


def process_job(srv, cfg, job, items, allowance):
    """Run one queued broadcast through the console's normal numbers flow."""
    job_id = job["id"]
    name = job.get("name") or job_id

    def report(results, cancel=False):
        payload = {"jobId": job_id, "results": results}
        if cancel:
            payload["cancelJob"] = True
        try:
            return post_retry(cfg, "agentReport", payload)
        except Exception as exc:
            srv.log(f"  Admin sync: could not report to the admin ({exc})")
            return None

    # People left "sending" by a crash / power cut: never auto-resend (could duplicate).
    stuck = [i for i in items if i.get("status") == "sending"]
    if stuck:
        report([{"itemId": i["id"], "status": "failed",
                 "error": "Interrupted (console stopped mid-send) - not resent to avoid a duplicate"} for i in stuck])
        srv.log(f"Admin sync: {len(stuck)} person(s) were interrupted last time and were NOT resent.")

    todo = [i for i in items if i.get("status") == "pending" and _digits10(i.get("phone"))][:allowance]
    if not todo:
        report([])
        return

    numbers, messages, item_of = [], {}, {}
    for i in todo:
        n = _digits10(i["phone"])
        if n in item_of:
            continue
        numbers.append(n)
        messages[n] = i.get("text", "")
        item_of[n] = i["id"]

    label = f'Admin broadcast "{name}" - {len(numbers)} people'
    if not srv._countdown("admin-sync", label, int(cfg.get("countdown_seconds", 30))):
        srv.log(f"{label}: skipped from the countdown, broadcast cancelled.")
        report([], cancel=True)
        return

    state = {}

    def on_item(number, status):
        item_id = item_of.get(number)
        if not item_id:
            return
        state[number] = status
        out = report([{"itemId": item_id, "status": status}])
        if status == "sent":
            _bump_sent(1)
        # Admin pressed Cancel on the website: stop before the next person.
        if out and out.get("jobStatus") == "cancelled":
            with srv.state_lock:
                srv.run_state["stop_requested"] = True
            srv.log("Admin sync: broadcast cancelled from the admin website - stopping.")

    result = srv.run_automation(
        "numbers", numbers, "", [], meta={"source": "admin", "label": name},
        messages=messages, on_item=on_item,
    )

    detail = ""
    with srv.state_lock:
        detail = srv.run_state.get("last_detail", "") or ""

    # Anyone still "sending" when the run ended was not completed.
    unfinished = [n for n, s in state.items() if s == "sending"]
    if unfinished:
        why = detail or ("Stopped by you" if result == "stopped" else "Run did not finish")
        report([{"itemId": item_of[n], "status": "failed", "error": why[:250]} for n in unfinished])

    if result != "finished":
        # Stop / crash: do not let the loop pick the rest up and start clicking again.
        report([], cancel=True)
        srv.log(f'Admin sync: broadcast "{name}" cancelled ({result}).')
    else:
        report([])
        srv.log(f'Admin sync: broadcast "{name}" finished.')


def tick(srv):
    cfg = load_config()
    if not cfg.get("enabled"):
        return
    if not cfg.get("apps_script_url") or not cfg.get("agent_key") or "PASTE" in cfg["agent_key"]:
        _once(srv, "cfg", "Admin sync is on but data/admin_sync.json needs apps_script_url and agent_key.")
        return
    if not srv.AUTOMATION_AVAILABLE:
        _once(srv, "auto", "Admin sync: pyautogui / pywin32 are not installed on this PC, so it cannot send.")
        return
    if not srv.is_unlocked():
        _once(srv, "lock", "Admin sync waiting: unlock the console with your access key first.")
        _heartbeat(srv, cfg, "console locked - enter the access key")
        return

    with srv.state_lock:
        busy = bool(srv.run_state["running"] or srv.scheduler_state["pending"])
    if busy:
        return

    if not within_hours(cfg):
        _once(srv, "hours", f"Admin sync waiting for sending hours ({cfg['allowed_hours']}).")
        _heartbeat(srv, cfg, f"waiting for sending hours {cfg['allowed_hours']}")
        return

    limit = int(cfg.get("daily_limit", 60))
    left = limit - sent_today()
    if left <= 0:
        _once(srv, "limit", f"Admin sync: daily limit of {limit} reached - resumes tomorrow.")
        _heartbeat(srv, cfg, f"daily limit reached ({limit}/{limit})")
        return
    _once_seen.pop("limit", None)
    _once_seen.pop("hours", None)
    _once_seen.pop("lock", None)

    data = post_retry(cfg, "agentPoll", {"agentId": cfg["agent_id"], "note": ""})
    job = (data or {}).get("job")
    if not job:
        return
    process_job(srv, cfg, job, data.get("items") or [], left)


def _loop(srv):
    srv.log("Admin sync ready - watching for broadcasts from the admin website.")
    while True:
        try:
            tick(srv)
        except Exception as exc:
            _once(srv, "err", f"Admin sync error: {exc}")
        time.sleep(max(5, int(load_config().get("poll_seconds", 15))))


_thread = None


def start(srv):
    """Called once from server.py. Safe to call when the feature is switched off."""
    global _thread
    cfg = load_config()  # also creates data/admin_sync.json the first time
    if _thread and _thread.is_alive():
        return
    if not cfg.get("enabled"):
        srv.log("Admin sync is off (set \"enabled\": true in data/admin_sync.json to turn it on).")
    _thread = threading.Thread(target=_loop, args=(srv,), name="admin-sync", daemon=True)
    _thread.start()


# ---------------------------------------------------------------- setup check

def check():
    cfg = load_config()
    print("Admin sync check")
    print("-" * 40)
    print(f"enabled          : {cfg['enabled']}")
    print(f"agent_id         : {cfg['agent_id']}")
    print(f"allowed_hours    : {cfg['allowed_hours']}  (inside now: {within_hours(cfg)})")
    print(f"daily_limit      : {cfg['daily_limit']}  (sent today: {sent_today()})")
    if not cfg["apps_script_url"] or not cfg["agent_key"] or "PASTE" in cfg["agent_key"]:
        print("\nFAILED: fill in apps_script_url and agent_key in data/admin_sync.json")
        return 1
    try:
        post(cfg, "agentPoll", {"agentId": cfg["agent_id"], "peek": True, "note": "setup check"}, timeout=30)
    except Exception as exc:
        print(f"\nFAILED: could not talk to the admin queue: {exc}")
        return 1
    print("\nOK: connected. The admin dashboard should now show 'PC connected'.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        sys.exit(check())
    print(__doc__)
