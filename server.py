"""
WhatsApp Distributor Blast - local control panel backend.

Wraps the original pyautogui script in a Flask app so it can be
triggered from a browser instead of edited/run by hand each time.

Run on the SAME Windows machine that has Chrome + WhatsApp Web logged in:
    pip install -r requirements.txt
    python server.py
Then open http://127.0.0.1:5000 in a browser on that machine.

NOTE: this still drives the screen with pyautogui (mouse/keyboard
simulation), so don't touch the mouse/keyboard while a run is active,
and keep Chrome/WhatsApp Web in the same window position you calibrated
the coordinates against (use the Settings tab to calibrate/re-calibrate).

Safety net: press F9 twice quickly (within ~0.6s) at any time to force
a running dispatch to stop, even if the browser tab controlling it isn't
focused. This can be turned off from Settings.

Quick coordinate capture: press F8 anywhere on the PC to instantly copy
the cursor's current (x, y) to the clipboard - the Settings tab in the
browser will also show it in an animated readout you can assign straight
to any coordinate field.
"""

import hashlib
import io
import json
import os
import re
import secrets
import shutil
import string
import struct
import time
import uuid
import threading
from datetime import datetime, timedelta, time as dtime
from pathlib import Path
from urllib.parse import quote

from flask import Flask, jsonify, request, send_from_directory
from PIL import Image

try:
    import pyautogui
    import pyperclip
    import win32clipboard
    AUTOMATION_AVAILABLE = True
except ImportError:
    # Lets the server run (and the UI load) on a machine without the
    # Windows-only deps installed yet, e.g. while you're just testing the UI.
    AUTOMATION_AVAILABLE = False

try:
    import keyboard
    KEYBOARD_AVAILABLE = True
except ImportError:
    # The F9 double-press kill switch is optional - everything else works
    # without it (the in-app Stop button always works).
    KEYBOARD_AVAILABLE = False

APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

NUMBERS_FILE = DATA_DIR / "numbers.json"
GROUPS_FILE = DATA_DIR / "groups.json"
MESSAGE_FILE = DATA_DIR / "message.txt"
IMAGE_FILE = DATA_DIR / "distributor.png"
SETTINGS_FILE = DATA_DIR / "settings.json"
TEMPLATES_FILE = DATA_DIR / "templates.json"
SCHEDULES_FILE = DATA_DIR / "schedules.json"
HISTORY_FILE = DATA_DIR / "run_history.json"
ATTACH_DIR = DATA_DIR / "attachments"
ATTACH_DIR.mkdir(exist_ok=True)
STUDIO_DIR = APP_DIR / "studio"

# ---------------- access key (license) ----------------
# LICENSE_CONFIG_FILE ships WITH the app and only holds a *hash* of the
# current access key - never the key itself. Only whoever can edit this
# file (you, via license_tool.py, before you hand a copy to a client) can
# set or change the key. LICENSE_STATE_FILE lives only on the client's PC
# (never committed to git - see .gitignore) and records the hash of the
# key that machine last unlocked with. If you ever rotate the key in
# LICENSE_CONFIG_FILE, every existing install is locked out again until
# whoever you give the new key to types it in.
LICENSE_CONFIG_FILE = APP_DIR / "license_config.json"
LICENSE_STATE_FILE = DATA_DIR / "license_state.json"
FIRST_RUN_KEY_NOTICE = APP_DIR / "INITIAL_ACCESS_KEY_DO_NOT_SHIP.txt"

# Routes that must always work even while locked (the lock screen itself,
# the unlock endpoint, and the bare PWA metadata so "Install app" still
# looks right before someone unlocks it).
LICENSE_EXEMPT_PATHS = {
    "/license",
    "/api/license/unlock",
    "/api/license/status",
    "/manifest.json",
    "/service-worker.js",
}


def _hash_key(passkey: str, salt: str) -> str:
    return hashlib.sha256((salt + passkey).encode("utf-8")).hexdigest()


def _generate_random_key(length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def load_license_config():
    """Read license_config.json, creating a fresh random access key the
    very first time the app is ever run on this machine (before it's been
    handed to a client). The plaintext key is written ONCE to
    INITIAL_ACCESS_KEY_DO_NOT_SHIP.txt so you (the developer) can see it -
    read it, save it somewhere safe, then delete that file before you zip
    this up for a client. Use license_tool.py any time you want to set a
    key of your own choosing instead."""
    if LICENSE_CONFIG_FILE.exists():
        try:
            return json.loads(LICENSE_CONFIG_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    salt = secrets.token_hex(16)
    key = _generate_random_key()
    config = {"salt": salt, "key_hash": _hash_key(key, salt)}
    LICENSE_CONFIG_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")
    FIRST_RUN_KEY_NOTICE.write_text(
        "This access key was auto-generated the first time server.py ran.\n"
        f"ACCESS KEY: {key}\n\n"
        "Save this somewhere safe, then DELETE this file. Do not ship this "
        "file or commit it to git. To set your own key instead, run:\n"
        "    python license_tool.py set YOUR-NEW-KEY\n",
        encoding="utf-8",
    )
    print("=" * 60)
    print(f"  FIRST RUN: generated access key -> {key}")
    print(f"  (also saved to {FIRST_RUN_KEY_NOTICE.name} - read it, then delete it)")
    print("=" * 60)
    return config


def load_license_state():
    return load_json(LICENSE_STATE_FILE, {"unlocked_hash": None})


def save_license_state(state):
    save_json(LICENSE_STATE_FILE, state)


def is_unlocked():
    config = load_license_config()
    state = load_license_state()
    return bool(state.get("unlocked_hash")) and state.get("unlocked_hash") == config.get("key_hash")


LOCK_SCREEN_HTML = """<!doctype html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Adverzo Dispatch Console - Access Key</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Sora:wght@400;500;600&display=swap');
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#F5F6F8;color:#101828;font-family:Sora,'Segoe UI',Arial,sans-serif;}
  .card{background:#FFFFFF;border:1px solid #E4E8EF;border-radius:14px;padding:32px;
    width:min(360px,88vw);box-shadow:0 1px 2px rgba(16,24,40,.05),0 10px 30px rgba(16,24,40,.08);}
  h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:21px;margin:0 0 6px;}
  p{color:#566175;font-size:13px;margin:0 0 20px;line-height:1.55;}
  input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:8px;border:1px solid #D3D9E4;
    background:#F7F9FC;color:#101828;font-size:15px;letter-spacing:1px;margin-bottom:12px;font-family:inherit;}
  input:focus{outline:none;border-color:#2251D1;box-shadow:0 0 0 3px rgba(34,81,209,.15);background:#fff;}
  button{width:100%;padding:12px;border:0;border-radius:8px;background:#2251D1;color:#fff;
    font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;}
  button:hover{background:#1B3FA8;}
  button:disabled{opacity:.6;cursor:default;}
  #err{color:#D64545;font-size:13px;min-height:18px;margin-top:10px;}
</style></head>
<body>
  <form class="card" id="f">
    <h1>Adverzo Dispatch Console</h1>
    <p>Enter the access key you were given to unlock this console on this PC.</p>
    <input id="k" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ACCESS KEY" autofocus/>
    <button type="submit" id="b">Unlock</button>
    <div id="err"></div>
  </form>
<script>
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('b');
  const err = document.getElementById('err');
  const key = document.getElementById('k').value.trim();
  err.textContent = '';
  if (!key) { err.textContent = 'Enter your access key.'; return; }
  btn.disabled = true; btn.textContent = 'Checking...';
  try {
    const res = await fetch('/api/license/unlock', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ key })
    });
    const data = await res.json();
    if (data.ok) { location.href = '/'; }
    else { err.textContent = data.error || 'Incorrect access key.'; }
  } catch (e2) {
    err.textContent = 'Could not reach the server. Is it still running?';
  } finally {
    btn.disabled = false; btn.textContent = 'Unlock';
  }
});
</script>
</body></html>"""

DEFAULT_MESSAGE = """\U0001F680 **ADVERZO AUTOMATION** \U0001F680

We help businesses save time and grow faster with smart automation.

\u2705 Workflow & Process Automation
\u2705 Custom Business Tools & Dashboards
\u2705 Marketing & Outreach Automation
\u2705 Data & Reporting Systems
\u2705 Ongoing Support & Optimization

\U0001F4A1 If repetitive manual work is slowing your business down, we can build a solution tailored to you.

\U0001F4DE **Let's talk: [YOUR NUMBER]**

\U0001F517 **[YOUR WEBSITE / LINK]**

Reply to this message to get started!
"""

DEFAULT_TEMPLATES = [
    {
        "id": "default-order-update",
        "name": "Daily order update (groups)",
        "message": "{{greeting}}\n\ntoday's Order : {{date}}",
    },
    {
        "id": "default-promo",
        "name": "Automation promo (numbers)",
        "message": DEFAULT_MESSAGE,
    },
]

# =========================
# SCREEN POSITIONS & WAIT TIMES - calibrate these from the Settings tab.
# These are just the fallback defaults used the very first time the app
# runs, before data/settings.json exists.
# =========================
DEFAULT_SETTINGS = {
    # "numbers": type a phone number into a new chat (original single-contact flow)
    # "groups": search for and open an existing WhatsApp group by name
    "mode": "numbers",
    # numbers-mode only: the contact name typed into WhatsApp's search box to
    # reach the "new chat by number" flow. Editable from the UI (Settings tab).
    "search_name": "Naveen",
    # When True the app pops up a box before every numbers-mode run asking
    # which contact to search for (pre-filled with the last one used).
    "ask_search_name_each_run": True,
    # ---- scheduler ----
    "scheduler_enabled": True,            # master switch for all schedules
    "schedule_countdown_seconds": 30,     # warning before an unattended run takes over the mouse
    "schedule_grace_minutes": 20,         # how late a missed run may still fire (PC was busy/off)
    "keep_awake": True,                   # stop Windows sleeping / screensaver while the console runs
    "coords": {
        "chrome_click": [1237, 714],
        "top_tab_click": [27, 15],
        "search_box_click": [246, 226],
        # numbers-mode only: the contact WhatsApp uses to open "new chat by number"
        "contact_click": [280, 379],
        "chat_input_click": [1057, 991],
        "paste_number_click": [1724, 911],
        "open_chat_click": [1456, 815],
        # groups-mode only: the group that appears in the search results
        "group_select_click": [314, 423],
        # shared: the box you type the outgoing message into
        "message_box_click": [915, 1000],
    },
    "waits": {
        "open_wait": 3,
        "click_wait": 2,
        "search_wait": 2,
        "message_wait": 1,
        "between_wait": 8,
    },
    "hotkey_stop_enabled": True,
}

FAST, MEDIUM, SLOW = 0.15, 0.4, 0.8

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 400 * 1024 * 1024  # a few big attachments in one request


@app.before_request
def _enforce_license():
    path = request.path
    if path in LICENSE_EXEMPT_PATHS or path.startswith("/static/"):
        return None
    if is_unlocked():
        return None
    if path.startswith("/api/"):
        return jsonify({"error": "locked", "message": "Enter your access key first."}), 401
    return LOCK_SCREEN_HTML


@app.route("/license")
def license_page():
    return LOCK_SCREEN_HTML


@app.route("/api/license/status")
def api_license_status():
    return jsonify({"unlocked": is_unlocked()})


@app.route("/api/license/unlock", methods=["POST"])
def api_license_unlock():
    payload = request.get_json(force=True) or {}
    key = (payload.get("key") or "").strip()
    config = load_license_config()
    if not key or _hash_key(key, config["salt"]) != config["key_hash"]:
        return jsonify({"ok": False, "error": "Incorrect access key."}), 401
    save_license_state({"unlocked_hash": config["key_hash"]})
    log("Access key accepted - console unlocked on this PC.")
    return jsonify({"ok": True})


# ---- in-memory run state, shared with the background thread ----
state_lock = threading.Lock()
run_state = {
    "running": False,
    "stop_requested": False,
    "current_index": 0,
    "total": 0,
    "sent_count": 0,
    "mode": "numbers",
    "source": "manual",     # "manual" or "schedule" / who started the current run
    "label": "",            # schedule name for scheduled runs
    "schedule_id": None,
    "log": [],  # list of {"ts": float, "text": str}
}


def log(text: str):
    with state_lock:
        run_state["log"].append({"ts": time.time(), "text": text})
        run_state["log"] = run_state["log"][-300:]  # cap log size


# ---------------- persistence helpers ----------------

def load_json(path, default):
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return default
    return default


def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def load_numbers():
    return load_json(NUMBERS_FILE, [])


def save_numbers(numbers):
    save_json(NUMBERS_FILE, numbers)


def load_groups():
    return load_json(GROUPS_FILE, [])


def save_groups(groups):
    save_json(GROUPS_FILE, groups)


def load_message():
    if MESSAGE_FILE.exists():
        return MESSAGE_FILE.read_text(encoding="utf-8")
    return DEFAULT_MESSAGE


def save_message(text):
    MESSAGE_FILE.write_text(text, encoding="utf-8")


def deep_merge(base, override):
    """Merge override into base (dicts merge recursively; anything else replaces)."""
    result = dict(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_settings():
    saved = load_json(SETTINGS_FILE, {})
    return deep_merge(DEFAULT_SETTINGS, saved)


def save_settings(settings):
    save_json(SETTINGS_FILE, settings)


def clean_search_name(value, default="Naveen"):
    """Trim/collapse whitespace and cap length; fall back to the default so a
    blank field in the UI can never make the automation search for nothing."""
    name = " ".join(str(value or "").split())[:60]
    return name or default


def load_templates():
    templates = load_json(TEMPLATES_FILE, None)
    if templates is None:
        save_json(TEMPLATES_FILE, DEFAULT_TEMPLATES)
        return list(DEFAULT_TEMPLATES)
    return templates


def save_templates(templates):
    save_json(TEMPLATES_FILE, templates)


def render_message(raw_message: str) -> str:
    """Fill in {{greeting}} / {{date}} / {{time}} placeholders at send time,
    so one saved template/message works for every run (mirrors the original
    date+greeting script)."""
    now = datetime.now()
    hour = now.hour
    if hour < 12:
        greeting = "Good morning"
    elif hour < 17:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"
    return (
        raw_message
        .replace("{{greeting}}", greeting)
        .replace("{{date}}", now.strftime("%d-%m-%Y"))
        .replace("{{time}}", now.strftime("%I:%M %p"))
    )


# ---------------- attachments (images, video, PDF, documents) ----------------

IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "bmp", "gif"}
VIDEO_EXTS = {"mp4", "mov", "avi", "mkv", "webm", "3gp", "m4v"}
PDF_EXTS = {"pdf"}
DOC_EXTS = {"doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "zip"}
# Still images are pasted as a bitmap (the original, proven path). Everything
# else - including animated GIFs - is pasted as a real file so nothing is flattened.
DIB_EXTS = {"jpg", "jpeg", "png", "webp", "bmp"}
MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024

_ILLEGAL_NAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
_RESERVED_NAMES = {"CON", "PRN", "AUX", "NUL"} | {f"COM{i}" for i in range(1, 10)} | {f"LPT{i}" for i in range(1, 10)}


def attachment_kind(ext: str):
    ext = (ext or "").lower().lstrip(".")
    if ext in IMAGE_EXTS:
        return "image"
    if ext in VIDEO_EXTS:
        return "video"
    if ext in PDF_EXTS:
        return "pdf"
    if ext in DOC_EXTS:
        return "document"
    return None


def safe_display_name(name: str) -> str:
    """A Windows-safe file name that keeps the original wording (recipients see
    this name on documents), including non-English characters."""
    name = re.split(r"[\\/]", str(name or ""))[-1]
    name = _ILLEGAL_NAME_CHARS.sub("_", name).strip(" .")
    stem, ext = os.path.splitext(name)
    stem = stem.strip(" .")[:80] or "file"
    if stem.upper() in _RESERVED_NAMES:
        stem = "_" + stem
    return stem + ext.lower()


def save_uploaded_attachment(file_storage):
    """Store one uploaded file under data/attachments/<id>/<original name>.
    Returns (attachment_dict, error_message)."""
    original = safe_display_name(file_storage.filename)
    ext = Path(original).suffix.lower().lstrip(".")
    kind = attachment_kind(ext)
    if not kind:
        return None, f"\"{original}\" isn't a supported file type (images, video, PDF, Office/text files)."
    att_id = uuid.uuid4().hex[:12]
    folder = ATTACH_DIR / att_id
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / original
    file_storage.save(dest)
    size = dest.stat().st_size
    if size == 0 or size > MAX_ATTACHMENT_BYTES:
        shutil.rmtree(folder, ignore_errors=True)
        if size == 0:
            return None, f"\"{original}\" is empty."
        return None, f"\"{original}\" is over the {MAX_ATTACHMENT_BYTES // (1024 * 1024)} MB limit."
    return {"id": att_id, "name": original, "kind": kind, "ext": ext,
            "size": size, "rel": f"{att_id}/{original}"}, None


def delete_attachment_files(att):
    folder = ATTACH_DIR / str(att.get("id", ""))
    if att.get("id") and folder.is_dir() and folder.parent == ATTACH_DIR:
        shutil.rmtree(folder, ignore_errors=True)


def public_template(t):
    """Template as sent to the browser: adds preview URLs for attachments."""
    out = dict(t)
    atts = []
    for a in t.get("attachments", []) or []:
        b = dict(a)
        b["url"] = "/api/attachments/" + quote(a["rel"], safe="/")
        b["exists"] = (ATTACH_DIR / a["rel"]).exists()
        atts.append(b)
    out["attachments"] = atts
    return out


def templates_json():
    return jsonify([public_template(t) for t in load_templates()])


def template_attachments_for_run(template):
    """Attachment dicts (with absolute paths) in the order they'll be sent."""
    out = []
    for a in template.get("attachments", []) or []:
        out.append({"id": a["id"], "name": a["name"], "kind": a["kind"],
                    "size": a.get("size", 0), "path": ATTACH_DIR / a["rel"]})
    return out


def attachment_timing(att):
    """(seconds to wait for WhatsApp's preview before pressing Enter,
        seconds to wait afterwards so the upload gets going).
    Images keep the original timings; PDFs/documents and video wait longer,
    and bigger files wait longer still."""
    size_mb = (att.get("size") or 0) / (1024 * 1024)
    kind = att.get("kind")
    if kind == "image":
        return 2.5, 1.5
    if kind == "video":
        return min(4 + size_mb * 0.3, 25), min(3 + size_mb * 0.15, 15)
    return min(3.5 + size_mb * 0.1, 15), min(2 + size_mb * 0.05, 8)


# ---------------- automation ----------------

def copy_image_to_clipboard(image_path):
    image = Image.open(image_path)
    output = io.BytesIO()
    image.convert("RGB").save(output, "BMP")
    data = output.getvalue()[14:]
    output.close()
    win32clipboard.OpenClipboard()
    win32clipboard.EmptyClipboard()
    win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
    win32clipboard.CloseClipboard()


def build_hdrop_payload(paths):
    """Bytes for a Windows CF_HDROP clipboard entry (what Explorer's "Copy"
    puts on the clipboard for files): a DROPFILES header followed by
    double-null-terminated UTF-16 paths."""
    names = "".join(str(Path(p).resolve()) + "\0" for p in paths) + "\0"
    header = struct.pack("<IiiII", 20, 0, 0, 0, 1)  # pFiles, pt.x, pt.y, fNC, fWide
    return header + names.encode("utf-16le")


def copy_files_to_clipboard(paths):
    """Put real files on the clipboard so Ctrl+V in WhatsApp Web attaches them."""
    data = build_hdrop_payload(paths)
    win32clipboard.OpenClipboard()
    try:
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_HDROP, data)
    finally:
        win32clipboard.CloseClipboard()


def _stop_requested():
    with state_lock:
        return run_state["stop_requested"]


def _open_whatsapp_tab(coords, waits):
    pyautogui.press("win")
    time.sleep(waits["open_wait"])
    pyautogui.write("chrome", interval=0.03)
    time.sleep(1)
    pyautogui.press("enter")
    time.sleep(waits["open_wait"])

    pyautogui.click(*coords["chrome_click"])
    time.sleep(waits["click_wait"])
    pyautogui.click(*coords["top_tab_click"])
    time.sleep(waits["click_wait"])


def _pastes_as_image(att):
    ext = Path(att.get("name", "")).suffix.lower().lstrip(".")
    return att.get("kind") == "image" and ext in DIB_EXTS


def _send_attachments(attachments, coords):
    """Attach each file to the open chat, one message per file, in order."""
    total = len(attachments)
    for i, att in enumerate(attachments, start=1):
        if _stop_requested():
            return
        path = Path(att["path"])
        if not path.exists():
            log(f"  Attachment missing on disk, skipped: {att.get('name')}")
            continue
        log(f"  Attaching {i}/{total}: {att.get('name')}")
        pyautogui.click(*coords["message_box_click"])
        time.sleep(MEDIUM)
        if _pastes_as_image(att):
            copy_image_to_clipboard(path)
        else:
            copy_files_to_clipboard([path])
        time.sleep(FAST)
        pyautogui.hotkey("ctrl", "v")
        preview_wait, after_wait = attachment_timing(att)
        time.sleep(preview_wait)
        pyautogui.press("enter")
        time.sleep(after_wait)


def _send_text(message, coords):
    """Paste the (placeholder-filled) message and send it. Pasting - rather
    than typing - keeps line breaks in ONE message and supports emoji / any
    language. Skipped when the message is blank (attachment-only sends)."""
    rendered = render_message(message)
    if not rendered.strip():
        return
    pyautogui.click(*coords["message_box_click"])
    time.sleep(MEDIUM)
    pyperclip.copy(rendered)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(MEDIUM)
    pyautogui.press("enter")
    time.sleep(1.5)


def _notify_item(on_item, number, status):
    """Tell the admin-sync agent (if one started this run) how each number is
    going. A reporting hiccup must never break a send, so errors are only logged."""
    if on_item is None:
        return
    try:
        on_item(number, status)
    except Exception as exc:
        log(f"  (could not report status for {number}: {exc})")


def run_numbers_automation(numbers, message, attachments, coords, waits, search_name="Naveen",
                           messages=None, on_item=None):
    """`messages` (optional) maps number -> its own personalised text; any number
    not in it gets the shared `message`. `on_item(number, status)` (optional) is
    called with "sending" before each number and "sent" after it."""
    log(f"Starting run for {len(numbers)} number(s) (search name: \"{search_name}\")...")
    time.sleep(2)
    _open_whatsapp_tab(coords, waits)

    for index, number in enumerate(numbers, start=1):
        if _stop_requested():
            log("Stop requested - halting before next number.")
            break
        with state_lock:
            run_state["current_index"] = index

        log(f"[{index}/{len(numbers)}] Sending -> {number}")
        item_message = (messages or {}).get(number, message)
        _notify_item(on_item, number, "sending")

        pyautogui.click(*coords["search_box_click"])
        time.sleep(FAST)
        pyautogui.hotkey("ctrl", "a")
        pyautogui.press("backspace")
        pyperclip.copy(search_name)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(SLOW)

        pyautogui.click(*coords["contact_click"])
        time.sleep(SLOW)

        pyautogui.click(*coords["chat_input_click"])
        time.sleep(SLOW)
        pyautogui.hotkey("ctrl", "a")
        pyautogui.press("backspace")
        pyperclip.copy(number)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(MEDIUM)
        pyautogui.press("enter")
        time.sleep(1)

        pyautogui.click(*coords["paste_number_click"])
        time.sleep(0.8)
        pyautogui.click(*coords["open_chat_click"])
        time.sleep(8)

        _send_attachments(attachments, coords)
        if _stop_requested():
            log("Stop requested - not sending the text for this number.")
            break
        _send_text(item_message, coords)

        with state_lock:
            run_state["sent_count"] += 1
        _notify_item(on_item, number, "sent")
        log(f"Done with {number}")
        time.sleep(1)


def run_groups_automation(groups, message, attachments, coords, waits):
    log(f"Starting run for {len(groups)} group(s)...")
    time.sleep(2)
    _open_whatsapp_tab(coords, waits)

    for index, group in enumerate(groups, start=1):
        if _stop_requested():
            log("Stop requested - halting before next group.")
            break
        with state_lock:
            run_state["current_index"] = index

        log(f"[{index}/{len(groups)}] Sending -> {group}")

        # Click search box and clear the previous search
        pyautogui.click(*coords["search_box_click"])
        time.sleep(waits["message_wait"])
        pyautogui.hotkey("ctrl", "a")
        time.sleep(0.3)
        pyautogui.press("backspace")
        time.sleep(0.3)

        # Search for the group (pasted, so non-English group names work)
        pyperclip.copy(group)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(waits["search_wait"])

        # Open the group
        pyautogui.click(*coords["group_select_click"])
        time.sleep(waits["message_wait"])

        _send_attachments(attachments, coords)
        if _stop_requested():
            log("Stop requested - not sending the text for this group.")
            break
        _send_text(message, coords)

        with state_lock:
            run_state["sent_count"] += 1
        log(f"Done with {group}")
        time.sleep(waits["between_wait"])


# ---------------- run history ----------------

history_lock = threading.Lock()


def record_history(entry):
    entry = dict(entry)
    entry.setdefault("id", uuid.uuid4().hex[:10])
    entry.setdefault("at", datetime.now().strftime("%Y-%m-%dT%H:%M:%S"))
    with history_lock:
        items = load_json(HISTORY_FILE, [])
        items.insert(0, entry)
        save_json(HISTORY_FILE, items[:200])


def run_automation(mode, targets, message, attachments, search_name=None, meta=None,
                   messages=None, on_item=None):
    """Runs one dispatch (blocking). Returns "finished", "stopped" or "failed".
    `attachments` is a list of {name, kind, size, path}. `meta` says who asked
    for the run (manual / a schedule) and is shown in the UI + history."""
    meta = meta or {}
    settings = load_settings()
    coords = settings["coords"]
    waits = settings["waits"]
    search_name = clean_search_name(search_name or settings.get("search_name"))
    started = datetime.now()

    with state_lock:
        run_state["running"] = True
        run_state["stop_requested"] = False
        run_state["current_index"] = 0
        run_state["total"] = len(targets)
        run_state["sent_count"] = 0
        run_state["mode"] = mode
        run_state["source"] = meta.get("source", "manual")
        run_state["label"] = meta.get("label", "")
        run_state["schedule_id"] = meta.get("schedule_id")

    status, detail = "finished", ""
    try:
        if mode == "groups":
            run_groups_automation(targets, message, attachments, coords, waits)
        else:
            run_numbers_automation(targets, message, attachments, coords, waits, search_name,
                                     messages=messages, on_item=on_item)
    except Exception as exc:  # keep the UI informed instead of silently dying
        status, detail = "failed", str(exc)
        log(f"Run crashed: {exc}")

    with state_lock:
        stopped = run_state["stop_requested"]
        sent = run_state["sent_count"]
        total = run_state["total"]
        run_state["running"] = False
        run_state["last_detail"] = detail
    if status != "failed" and stopped:
        status = "stopped"
    log("Run stopped by user." if status == "stopped" else "Run finished." if status == "finished" else "Run failed.")

    record_history({
        "at": started.strftime("%Y-%m-%dT%H:%M:%S"),
        "finished_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "source": meta.get("source", "manual"),
        "label": meta.get("label", ""),
        "schedule_id": meta.get("schedule_id"),
        "mode": mode, "status": status, "sent": sent, "total": total,
        "attachments": len(attachments or []), "detail": detail,
    })
    return status


# ---------------- scheduler ----------------
# One background thread checks the saved schedules every few seconds. When one
# is due it (1) shows a countdown so nobody is surprised when the mouse starts
# moving, (2) runs the normal dispatch, then (3) works out the next run time.
# The PC must be on, signed in, unlocked, and this console must be running.

schedule_lock = threading.RLock()
templates_lock = threading.RLock()
scheduler_state = {"pending": None, "skip": False}
run_now_queue = []
scheduler_wake = threading.Event()  # lets "Run now" start within a second instead of waiting for the next check
ISO = "%Y-%m-%dT%H:%M:%S"
_TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load_schedules():
    return load_json(SCHEDULES_FILE, [])


def save_schedules(items):
    save_json(SCHEDULES_FILE, items)


def parse_iso(value):
    try:
        return datetime.strptime(value, ISO)
    except (TypeError, ValueError):
        return None


def compute_next_run(sched, after):
    """First run time strictly after `after` (a naive local datetime), or None."""
    hh, mm = (int(x) for x in sched["time"].split(":"))
    repeat = sched.get("repeat", "daily")
    if repeat == "once":
        day = datetime.strptime(sched["date"], "%Y-%m-%d").date()
        when = datetime.combine(day, dtime(hh, mm))
        return when if when > after else None
    days = set(sched.get("days") or [])
    for offset in range(0, 8):
        day = after.date() + timedelta(days=offset)
        if repeat == "weekly" and day.weekday() not in days:
            continue
        when = datetime.combine(day, dtime(hh, mm))
        if when > after:
            return when
    return None


def scheduler_config():
    s = load_settings()
    return {
        "enabled": bool(s.get("scheduler_enabled", True)),
        "countdown": int(s.get("schedule_countdown_seconds", 30)),
        "grace": int(s.get("schedule_grace_minutes", 20)),
        "keep_awake": bool(s.get("keep_awake", True)),
    }


def normalize_schedule(payload, existing=None):
    """Validate/clean a schedule from the browser. Returns (schedule, error)."""
    base = dict(existing or {})
    data = {**base, **{k: v for k, v in (payload or {}).items() if k in (
        "name", "mode", "template_id", "repeat", "time", "date", "days", "targets", "enabled")}}

    name = " ".join(str(data.get("name") or "").split())[:60] or "Scheduled send"
    mode = data.get("mode") if data.get("mode") in ("numbers", "groups") else load_settings().get("mode", "numbers")
    repeat = data.get("repeat") if data.get("repeat") in ("once", "daily", "weekly") else "daily"
    when_time = str(data.get("time") or "")
    if not _TIME_RE.match(when_time):
        return None, "Pick a valid time (HH:MM)."
    template_id = str(data.get("template_id") or "")
    if template_id and not any(t["id"] == template_id for t in load_templates()):
        return None, "That template no longer exists."

    date_str, days = "", []
    if repeat == "once":
        date_str = str(data.get("date") or "")
        if not _DATE_RE.match(date_str):
            return None, "Pick a date for a one-time send."
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None, "That date isn't valid."
    if repeat == "weekly":
        try:
            days = sorted({int(d) for d in (data.get("days") or []) if 0 <= int(d) <= 6})
        except (TypeError, ValueError):
            days = []
        if not days:
            return None, "Choose at least one day of the week."

    targets = [str(t).strip()[:200] for t in (data.get("targets") or []) if str(t).strip()][:2000]

    sched = {
        "id": base.get("id") or uuid.uuid4().hex[:10],
        "created": base.get("created") or datetime.now().strftime(ISO),
        "name": name, "mode": mode, "template_id": template_id,
        "repeat": repeat, "time": when_time, "date": date_str, "days": days,
        "targets": targets, "enabled": bool(data.get("enabled", True)),
        "next_run": None,
        "last_run": base.get("last_run"), "last_status": base.get("last_status"),
        "last_detail": base.get("last_detail", ""),
    }
    nxt = compute_next_run(sched, datetime.now())
    if repeat == "once" and nxt is None:
        return None, "That date and time has already passed - pick a time in the future."
    sched["next_run"] = nxt.strftime(ISO) if nxt else None
    return sched, None


def upcoming_runs(schedules, now, days=7, limit=80):
    end = now + timedelta(days=days)
    out = []
    for s in schedules:
        if not s.get("enabled"):
            continue
        t = parse_iso(s.get("next_run"))
        guard = 0
        while t and t <= end and guard < 60:
            out.append({"schedule_id": s["id"], "name": s["name"], "at": t.strftime(ISO)})
            t = compute_next_run(s, t)
            guard += 1
    out.sort(key=lambda r: r["at"])
    return out[:limit]


def _beep(freq=880, ms=180):
    try:
        import winsound
        winsound.Beep(freq, ms)
    except Exception:
        pass  # not on Windows / no sound device - the on-screen countdown still shows


def _countdown(sched_id, name, seconds):
    """Warn before an unattended run takes over the mouse. Returns False if skipped."""
    if seconds <= 0:
        return True
    starts_at = time.time() + seconds
    with state_lock:
        scheduler_state["pending"] = {"schedule_id": sched_id, "name": name,
                                      "starts_at": starts_at, "seconds": seconds}
        scheduler_state["skip"] = False
    log(f"Scheduled run \"{name}\" starts in {seconds}s - hands off the mouse. Press Skip to cancel it.")
    _beep(660, 250)
    beeped = set()
    while True:
        remaining = starts_at - time.time()
        with state_lock:
            if scheduler_state["skip"]:
                scheduler_state["pending"] = None
                scheduler_state["skip"] = False
                return False
        if remaining <= 0:
            break
        whole = int(remaining)
        if whole <= 3 and whole not in beeped:
            beeped.add(whole)
            _beep(880, 120)
        time.sleep(0.25)
    with state_lock:
        scheduler_state["pending"] = None
    _beep(1046, 350)
    return True


def _resolve_run(sched):
    """Work out message / attachments / recipients for a schedule.
    Raises ValueError with a human-readable reason if it can't run."""
    mode = sched["mode"]
    template_name = "Dashboard message"
    if sched.get("template_id"):
        tpl = next((t for t in load_templates() if t["id"] == sched["template_id"]), None)
        if not tpl:
            raise ValueError("its template was deleted")
        message = tpl.get("message", "")
        attachments = template_attachments_for_run(tpl)
        template_name = tpl.get("name", "Template")
    else:
        message = load_message()
        attachments = []
        if mode == "numbers" and IMAGE_FILE.exists():
            attachments = [{"id": "legacy", "name": IMAGE_FILE.name, "kind": "image",
                            "size": IMAGE_FILE.stat().st_size, "path": IMAGE_FILE}]
    targets = sched.get("targets") or (load_groups() if mode == "groups" else load_numbers())
    if not targets:
        raise ValueError("there is nobody to send to (add " + ("groups" if mode == "groups" else "numbers") + " or a custom list)")
    if not message.strip() and not attachments:
        raise ValueError("the message is empty and there are no attachments")
    return mode, targets, message, attachments, template_name


def _update_schedule(sched_id, **changes):
    with schedule_lock:
        items = load_schedules()
        for s in items:
            if s["id"] == sched_id:
                s.update(changes)
                break
        save_schedules(items)


def execute_schedule(sched, source):
    """Countdown -> run -> reschedule. `source` is "schedule" (it came due) or
    "manual" (the Run-now button, which doesn't move the next scheduled time)."""
    cfg = scheduler_config()
    sid, name = sched["id"], sched["name"]
    now = datetime.now()

    def finish(status, detail="", sent=None, total=None):
        _update_schedule(sid, last_run=now.strftime(ISO), last_status=status, last_detail=detail)

    if source == "schedule":  # move the clock on first, so a crash can never cause a repeat loop
        if sched["repeat"] == "once":  # a one-time send is finished once it fires
            changes = {"next_run": None, "enabled": False}
        else:
            nxt = compute_next_run(sched, now)
            changes = {"next_run": nxt.strftime(ISO) if nxt else None}
        _update_schedule(sid, **changes)

    try:
        mode, targets, message, attachments, template_name = _resolve_run(sched)
    except ValueError as exc:
        reason = str(exc)
        log(f"Scheduled run \"{name}\" could not start: {reason}.")
        finish("failed", reason)
        record_history({"source": source, "label": name, "schedule_id": sid,
                        "mode": sched["mode"], "status": "failed", "detail": reason})
        return

    if not AUTOMATION_AVAILABLE:
        reason = "pyautogui/pywin32 not installed on this PC"
        finish("failed", reason)
        record_history({"source": source, "label": name, "schedule_id": sid,
                        "mode": mode, "status": "failed", "detail": reason})
        return

    seconds = cfg["countdown"] if source == "schedule" else min(cfg["countdown"], 5)
    if not _countdown(sid, name, seconds):
        log(f"Scheduled run \"{name}\" skipped by user.")
        finish("skipped", "Skipped from the countdown")
        record_history({"source": source, "label": name, "schedule_id": sid,
                        "mode": mode, "status": "skipped", "detail": "Skipped from the countdown"})
        return

    status = run_automation(mode, targets, message, attachments,
                            meta={"source": source, "label": name, "schedule_id": sid})
    finish(status)


def scheduler_tick():
    cfg = scheduler_config()

    with schedule_lock:
        queued = run_now_queue.pop(0) if run_now_queue else None
    if queued:
        sched = next((s for s in load_schedules() if s["id"] == queued), None)
        with state_lock:
            busy = run_state["running"]
        if sched and not busy:
            execute_schedule(sched, "manual")
        return

    if not cfg["enabled"]:
        return
    with state_lock:
        if run_state["running"]:
            return  # a manual run is in progress - due schedules wait their turn (within the grace window)

    now = datetime.now()
    due = []
    for s in load_schedules():
        nr = parse_iso(s.get("next_run"))
        if s.get("enabled") and nr and nr <= now:
            due.append((nr, s))
    due.sort(key=lambda pair: pair[0])

    for nr, s in due:
        late_minutes = (datetime.now() - nr).total_seconds() / 60
        if late_minutes > cfg["grace"]:
            nxt = None if s["repeat"] == "once" else compute_next_run(s, datetime.now())
            changes = {"next_run": nxt.strftime(ISO) if nxt else None,
                       "last_run": nr.strftime(ISO), "last_status": "missed",
                       "last_detail": f"PC/console wasn't ready (over {cfg['grace']} min late)"}
            if s["repeat"] == "once":
                changes["enabled"] = False
            _update_schedule(s["id"], **changes)
            record_history({"source": "schedule", "label": s["name"], "schedule_id": s["id"],
                            "mode": s["mode"], "status": "missed", "detail": changes["last_detail"]})
            log(f"Missed schedule \"{s['name']}\" ({nr.strftime('%d %b %H:%M')}).")
            continue
        execute_schedule(s, "schedule")


def _set_keep_awake(on):
    """Ask Windows not to sleep / start the screensaver while the console runs
    (a locked screen would still block the mouse automation)."""
    try:
        import ctypes
        flags = 0x80000000 | ((0x1 | 0x2) if on else 0)  # ES_CONTINUOUS | SYSTEM | DISPLAY
        ctypes.windll.kernel32.SetThreadExecutionState(ctypes.c_uint(flags))
    except Exception:
        pass


_scheduler_thread = None


def scheduler_loop():
    last_awake = None
    while True:
        try:
            awake = scheduler_config()["keep_awake"]
            if awake != last_awake:
                _set_keep_awake(awake)
                last_awake = awake
            scheduler_tick()
        except Exception as exc:
            log(f"Scheduler error: {exc}")
        scheduler_wake.wait(5)
        scheduler_wake.clear()


def start_scheduler():
    global _scheduler_thread
    if _scheduler_thread and _scheduler_thread.is_alive():
        return
    _scheduler_thread = threading.Thread(target=scheduler_loop, name="scheduler", daemon=True)
    _scheduler_thread.start()
    log("Scheduler running - checking schedules every few seconds.")


# ---------------- F9 double-press kill switch / F8 quick-capture ----------------

_last_f9_press = [0.0]
F9_DOUBLE_PRESS_WINDOW = 0.6  # seconds between presses to count as a "double-press"

last_capture_lock = threading.Lock()
last_capture = {"x": None, "y": None, "ts": 0}


def _on_f9_press(_event=None):
    settings = load_settings()
    if not settings.get("hotkey_stop_enabled", True):
        return
    now = time.time()
    if now - _last_f9_press[0] <= F9_DOUBLE_PRESS_WINDOW:
        _last_f9_press[0] = 0.0
        with state_lock:
            if not run_state["running"]:
                return
            run_state["stop_requested"] = True
        log("F9 pressed twice - stop requested.")
    else:
        _last_f9_press[0] = now


def _on_f8_press(_event=None):
    """Instant coordinate grab: wherever the mouse is when F8 is pressed,
    copy "x, y" straight to the clipboard and hand it to the Settings tab
    so it can show an animated readout."""
    if not AUTOMATION_AVAILABLE:
        return
    x, y = pyautogui.position()
    try:
        pyperclip.copy(f"{x}, {y}")
    except Exception:
        pass
    with last_capture_lock:
        last_capture["x"] = int(x)
        last_capture["y"] = int(y)
        last_capture["ts"] = time.time()
    log(f"F8 captured ({x}, {y}) - copied to clipboard.")


def start_hotkey_listener():
    if not KEYBOARD_AVAILABLE:
        log("Hotkeys unavailable - install the 'keyboard' package to enable F9 stop / F8 capture.")
        return
    try:
        keyboard.on_press_key("f9", _on_f9_press)
        keyboard.on_press_key("f8", _on_f8_press)
        log("Armed: F8 copies the cursor's coordinates, double-press F9 force-stops a run.")
    except Exception as exc:
        log(f"Could not arm F9 hotkey (try running as admin): {exc}")


# ---------------- routes ----------------

WIDGET_TAG = '<script src="/search-name-widget.js"></script>'


@app.route("/")
def index():
    """Serve the dashboard page, adding the in-app "search name" prompt
    (search_name_widget.js) on the way out so it works without editing
    templates/index.html by hand."""
    page_file = APP_DIR / "templates" / "index.html"
    if not page_file.exists():
        return (
            "<h2>templates/index.html is missing</h2>"
            "<p>Copy your dashboard page into the <code>templates</code> folder "
            "next to server.py and refresh.</p>", 500)
    html = page_file.read_text(encoding="utf-8")
    if WIDGET_TAG not in html:
        idx = html.lower().rfind("</body>")
        html = html[:idx] + WIDGET_TAG + html[idx:] if idx != -1 else html + WIDGET_TAG
    resp = app.response_class(html, mimetype="text/html")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.route("/search-name-widget.js")
def search_name_widget():
    return send_from_directory(APP_DIR, "search_name_widget.js", mimetype="application/javascript")


@app.route("/manifest.json")
def manifest():
    return send_from_directory(APP_DIR, "manifest.json", mimetype="application/manifest+json")


@app.route("/service-worker.js")
def service_worker():
    # Served from the root (not /static/) so its scope covers the whole app.
    return send_from_directory(APP_DIR, "service-worker.js", mimetype="application/javascript")


@app.route("/data/<path:filename>")
def data_file(filename):
    return send_from_directory(DATA_DIR, filename)


@app.route("/api/numbers", methods=["GET", "POST"])
def api_numbers():
    if request.method == "GET":
        return jsonify(load_numbers())
    payload = request.get_json(force=True)
    numbers = [n.strip() for n in payload.get("numbers", []) if n.strip()]
    save_numbers(numbers)
    return jsonify(numbers)


@app.route("/api/groups", methods=["GET", "POST"])
def api_groups():
    if request.method == "GET":
        return jsonify(load_groups())
    payload = request.get_json(force=True)
    groups = [g.strip() for g in payload.get("groups", []) if g.strip()]
    save_groups(groups)
    return jsonify(groups)


@app.route("/api/message", methods=["GET", "POST"])
def api_message():
    if request.method == "GET":
        return jsonify({"message": load_message()})
    payload = request.get_json(force=True)
    save_message(payload.get("message", ""))
    return jsonify({"message": load_message()})


@app.route("/api/image", methods=["GET", "POST"])
def api_image():
    if request.method == "POST":
        file = request.files.get("image")
        if not file:
            return jsonify({"error": "no file"}), 400
        file.save(IMAGE_FILE)
        return jsonify({"ok": True, "filename": IMAGE_FILE.name})
    return jsonify({"exists": IMAGE_FILE.exists()})


@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    if request.method == "GET":
        return jsonify(load_settings())
    payload = request.get_json(force=True) or {}
    settings = deep_merge(load_settings(), payload)
    settings["search_name"] = clean_search_name(settings.get("search_name"))
    settings["ask_search_name_each_run"] = bool(settings.get("ask_search_name_each_run", True))
    save_settings(settings)
    with state_lock:
        run_state["mode"] = settings.get("mode", run_state["mode"])
    return jsonify(settings)


@app.route("/api/last-capture")
def api_last_capture():
    """Polled by the Settings tab to show an animated reveal whenever F8
    is pressed anywhere on the PC."""
    with last_capture_lock:
        return jsonify(dict(last_capture))


@app.route("/api/mouse-position")
def api_mouse_position():
    """Instant (no delay) mouse position - polled continuously by the Settings
    tab's live tracker widget so people can watch the cursor move in real time."""
    if not AUTOMATION_AVAILABLE:
        return jsonify({"error": "pyautogui not installed on this machine"}), 400
    x, y = pyautogui.position()
    return jsonify({"x": int(x), "y": int(y)})


@app.route("/api/screen-info")
def api_screen_info():
    if not AUTOMATION_AVAILABLE:
        return jsonify({"error": "pyautogui not installed on this machine"}), 400
    width, height = pyautogui.size()
    return jsonify({"width": int(width), "height": int(height)})


@app.route("/api/capture-position", methods=["POST"])
def api_capture_position():
    """Give the user a few seconds to hover the mouse over a target on
    screen, then report back its exact coordinates - used by the Settings
    tab so people don't have to guess pixel positions by hand."""
    if not AUTOMATION_AVAILABLE:
        return jsonify({"error": "pyautogui not installed on this machine"}), 400
    payload = request.get_json(force=True) or {}
    delay = max(0.5, min(float(payload.get("delay", 3)), 15))
    time.sleep(delay)
    x, y = pyautogui.position()
    return jsonify({"x": int(x), "y": int(y)})


@app.route("/api/templates", methods=["GET", "POST"])
def api_templates():
    if request.method == "GET":
        return templates_json()
    payload = request.get_json(force=True) or {}
    with templates_lock:
        templates = load_templates()
        new_template = {
            "id": uuid.uuid4().hex[:10],
            "name": (payload.get("name") or "Untitled template").strip(),
            "message": payload.get("message", ""),
            "attachments": [],
        }
        templates.append(new_template)
        save_templates(templates)
    return templates_json()


@app.route("/api/templates/<template_id>/update", methods=["POST"])
def api_template_update(template_id):
    payload = request.get_json(force=True) or {}
    with templates_lock:
        templates = load_templates()
        for t in templates:
            if t["id"] == template_id:
                if "name" in payload:
                    t["name"] = payload["name"].strip() or t["name"]
                if "message" in payload:
                    t["message"] = payload["message"]
                break
        else:
            return jsonify({"error": "template not found"}), 404
        save_templates(templates)
    return templates_json()


@app.route("/api/templates/<template_id>/delete", methods=["POST"])
def api_template_delete(template_id):
    with templates_lock:
        templates = load_templates()
        for t in templates:
            if t["id"] == template_id:
                for att in t.get("attachments", []) or []:
                    delete_attachment_files(att)
        templates = [t for t in templates if t["id"] != template_id]
        save_templates(templates)
    return templates_json()


# ---- attachments (per template; sent in the order shown) ----

@app.route("/api/templates/<template_id>/attachments", methods=["POST"])
def api_template_attachments_upload(template_id):
    files = [f for f in request.files.getlist("files") if f and f.filename]
    if not files:
        return jsonify({"error": "no file received"}), 400
    added, errors = [], []
    with templates_lock:
        templates = load_templates()
        tpl = next((t for t in templates if t["id"] == template_id), None)
        if not tpl:
            return jsonify({"error": "template not found"}), 404
        tpl.setdefault("attachments", [])
        for f in files:
            att, err = save_uploaded_attachment(f)
            if err:
                errors.append(err)
            else:
                tpl["attachments"].append(att)
                added.append(att["name"])
        save_templates(templates)
    status = 200 if added else 400
    return jsonify({"added": added, "errors": errors,
                    "templates": [public_template(t) for t in load_templates()]}), status


@app.route("/api/templates/<template_id>/attachments/<att_id>/delete", methods=["POST"])
def api_template_attachment_delete(template_id, att_id):
    with templates_lock:
        templates = load_templates()
        tpl = next((t for t in templates if t["id"] == template_id), None)
        if not tpl:
            return jsonify({"error": "template not found"}), 404
        keep = []
        for a in tpl.get("attachments", []) or []:
            if a["id"] == att_id:
                delete_attachment_files(a)
            else:
                keep.append(a)
        tpl["attachments"] = keep
        save_templates(templates)
    return templates_json()


@app.route("/api/templates/<template_id>/attachments/reorder", methods=["POST"])
def api_template_attachments_reorder(template_id):
    order = (request.get_json(force=True) or {}).get("order", [])
    with templates_lock:
        templates = load_templates()
        tpl = next((t for t in templates if t["id"] == template_id), None)
        if not tpl:
            return jsonify({"error": "template not found"}), 404
        rank = {att_id: i for i, att_id in enumerate(order)}
        tpl["attachments"] = sorted(tpl.get("attachments", []) or [],
                                    key=lambda a: rank.get(a["id"], len(rank)))
        save_templates(templates)
    return templates_json()


@app.route("/api/attachments/<path:rel>")
def api_attachment_file(rel):
    return send_from_directory(ATTACH_DIR, rel)


@app.errorhandler(413)
def _too_large(_e):
    return jsonify({"error": "Upload too large (limit is 100 MB per file)."}), 413


# ---- scheduler + history ----

def _scheduler_public_status():
    cfg = scheduler_config()
    now = datetime.now()
    schedules = load_schedules()
    ups = upcoming_runs(schedules, now, days=7)
    next_up = None
    if cfg["enabled"] and ups:
        first = ups[0]
        secs = max(0, int((parse_iso(first["at"]) - now).total_seconds()))
        next_up = {**first, "seconds_until": secs}
    with state_lock:
        pending = dict(scheduler_state["pending"]) if scheduler_state["pending"] else None
        run = {k: run_state[k] for k in ("running", "current_index", "total", "sent_count",
                                          "mode", "source", "label", "schedule_id")}
    if pending:
        pending["remaining"] = max(0.0, pending["starts_at"] - time.time())
    return {
        "server_now": now.strftime(ISO),
        "config": cfg,
        "automation_available": AUTOMATION_AVAILABLE,
        "pending": pending,
        "run": run,
        "next_up": next_up,
        "upcoming": ups,
        "active_schedules": sum(1 for s in schedules if s.get("enabled")),
    }


@app.route("/api/scheduler/status")
def api_scheduler_status():
    return jsonify(_scheduler_public_status())


@app.route("/api/scheduler/config", methods=["GET", "POST"])
def api_scheduler_config():
    if request.method == "POST":
        p = request.get_json(force=True) or {}
        patch = {}
        if "enabled" in p:
            patch["scheduler_enabled"] = bool(p["enabled"])
        if "keep_awake" in p:
            patch["keep_awake"] = bool(p["keep_awake"])
        if "countdown" in p:
            patch["schedule_countdown_seconds"] = max(5, min(int(p["countdown"]), 300))
        if "grace" in p:
            patch["schedule_grace_minutes"] = max(1, min(int(p["grace"]), 720))
        save_settings(deep_merge(load_settings(), patch))
    return jsonify(scheduler_config())


@app.route("/api/scheduler/skip", methods=["POST"])
def api_scheduler_skip():
    with state_lock:
        if not scheduler_state["pending"]:
            return jsonify({"ok": False, "error": "nothing is waiting to start"}), 409
        scheduler_state["skip"] = True
    return jsonify({"ok": True})


@app.route("/api/schedules", methods=["GET", "POST"])
def api_schedules():
    if request.method == "GET":
        return jsonify(load_schedules())
    with schedule_lock:
        sched, err = normalize_schedule(request.get_json(force=True) or {})
        if err:
            return jsonify({"error": err}), 400
        items = load_schedules()
        items.append(sched)
        save_schedules(items)
    return jsonify(load_schedules())


@app.route("/api/schedules/<sid>/update", methods=["POST"])
def api_schedule_update(sid):
    with schedule_lock:
        items = load_schedules()
        for i, s in enumerate(items):
            if s["id"] == sid:
                new, err = normalize_schedule(request.get_json(force=True) or {}, existing=s)
                if err:
                    return jsonify({"error": err}), 400
                items[i] = new
                break
        else:
            return jsonify({"error": "schedule not found"}), 404
        save_schedules(items)
    return jsonify(load_schedules())


@app.route("/api/schedules/<sid>/toggle", methods=["POST"])
def api_schedule_toggle(sid):
    enabled = bool((request.get_json(force=True) or {}).get("enabled", True))
    with schedule_lock:
        items = load_schedules()
        for i, s in enumerate(items):
            if s["id"] == sid:
                new, err = normalize_schedule({"enabled": enabled}, existing=s)
                if err:  # e.g. a one-time schedule whose time has passed
                    return jsonify({"error": err}), 400
                items[i] = new
                break
        else:
            return jsonify({"error": "schedule not found"}), 404
        save_schedules(items)
    return jsonify(load_schedules())


@app.route("/api/schedules/<sid>/delete", methods=["POST"])
def api_schedule_delete(sid):
    with schedule_lock:
        save_schedules([s for s in load_schedules() if s["id"] != sid])
    return jsonify(load_schedules())


@app.route("/api/schedules/<sid>/run-now", methods=["POST"])
def api_schedule_run_now(sid):
    if not AUTOMATION_AVAILABLE:
        return jsonify({"error": "pyautogui/pywin32 not installed on this machine"}), 400
    with state_lock:
        if run_state["running"] or scheduler_state["pending"]:
            return jsonify({"error": "a run is already in progress"}), 409
    with schedule_lock:
        if not any(s["id"] == sid for s in load_schedules()):
            return jsonify({"error": "schedule not found"}), 404
        if sid not in run_now_queue:
            run_now_queue.append(sid)
    scheduler_wake.set()
    return jsonify({"ok": True})


@app.route("/api/history")
def api_history():
    limit = max(1, min(int(request.args.get("limit", 50)), 200))
    return jsonify(load_json(HISTORY_FILE, [])[:limit])


@app.route("/api/history/clear", methods=["POST"])
def api_history_clear():
    with history_lock:
        save_json(HISTORY_FILE, [])
    return jsonify([])


@app.route("/studio")
def studio_page():
    resp = send_from_directory(STUDIO_DIR, "studio.html")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.route("/api/start", methods=["POST"])
def api_start():
    if not AUTOMATION_AVAILABLE:
        return jsonify({"error": "pyautogui/pywin32 not installed on this machine"}), 400
    with state_lock:
        if run_state["running"] or scheduler_state["pending"]:
            return jsonify({"error": "already running"}), 409

    settings = load_settings()
    mode = settings.get("mode", "numbers")

    if mode == "groups":
        targets = load_groups()
        if not targets:
            return jsonify({"error": "no groups saved"}), 400
    else:
        targets = load_numbers()
        if not targets:
            return jsonify({"error": "no numbers saved"}), 400

    # Optional: run straight from a template (its message + its attachments).
    payload = request.get_json(silent=True) or {}
    template_id = payload.get("template_id")
    if template_id:
        tpl = next((t for t in load_templates() if t["id"] == template_id), None)
        if not tpl:
            return jsonify({"error": "template not found"}), 404
        message = tpl.get("message", "")
        attachments = template_attachments_for_run(tpl)
        label = tpl.get("name", "Template")
    else:
        message = load_message()
        attachments = []
        if mode == "numbers" and IMAGE_FILE.exists():  # the original single-image behaviour
            attachments = [{"id": "legacy", "name": IMAGE_FILE.name, "kind": "image",
                            "size": IMAGE_FILE.stat().st_size, "path": IMAGE_FILE}]
        label = "Dashboard message"

    thread = threading.Thread(
        target=run_automation, args=(mode, targets, message, attachments),
        kwargs={"meta": {"source": "manual", "label": label}}, daemon=True)
    thread.start()
    return jsonify({"ok": True, "mode": mode, "total": len(targets)})


@app.route("/api/stop", methods=["POST"])
def api_stop():
    with state_lock:
        run_state["stop_requested"] = True
    log("Stop requested...")
    return jsonify({"ok": True})


@app.route("/api/status")
def api_status():
    with state_lock:
        return jsonify(dict(run_state))


if __name__ == "__main__":
    load_license_config()  # generates + prints a one-time key on the very first run
    if not MESSAGE_FILE.exists():
        save_message(DEFAULT_MESSAGE)
    if not SETTINGS_FILE.exists():
        save_settings(DEFAULT_SETTINGS)
    if not TEMPLATES_FILE.exists():
        save_templates(DEFAULT_TEMPLATES)

    with state_lock:
        run_state["mode"] = load_settings().get("mode", "numbers")

    start_hotkey_listener()
    start_scheduler()

    # Optional: lets the admin website queue personalised bulk messages that
    # this console then sends (see ADMIN_SYNC_README.md). Does nothing until
    # data/admin_sync.json is filled in and "enabled" is true.
    try:
        import sys as _sys
        import admin_sync
        admin_sync.start(_sys.modules[__name__])
    except Exception as exc:
        log(f"Admin sync not started: {exc}")

    cert_path = APP_DIR / "cert.pem"
    key_path = APP_DIR / "key.pem"

    if cert_path.exists() and key_path.exists():
        print("HTTPS cert found - serving over https:// so phones can install the app.")
        print("Open https://<this-PC's-LAN-IP>:5000 on your phone (same wifi).")
        app.run(host="0.0.0.0", port=5000, debug=False, threaded=True,
                 ssl_context=(str(cert_path), str(key_path)))
    else:
        print("No cert.pem/key.pem found - serving plain http:// (localhost only for full features).")
        print("Run 'python generate_cert.py' once to enable HTTPS for phone installs.")
        app.run(host="192.168.29.206", port=5000, debug=False, threaded=True)
