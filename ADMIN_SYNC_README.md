# Admin Sync — send the admin's broadcast with the Python console

Admin website -> Google Sheet queue -> this console (polls every 15s) -> WhatsApp Web via the usual pyautogui flow.

## One-time setup
1. Website zip applied + pushed (Vercel redeploys).
2. Google Sheet > Extensions > Apps Script: replace Code.gs with the new one, Save,
   run `setup` once, then Deploy > Manage deployments > Edit > New version > Deploy (same URL).
3. In the Apps Script editor run `createAgentKey` once. View > Logs: copy the key.
4. Paste the key into `data/admin_sync.json` (agent_key).
5. Replace `server.py` and add `admin_sync.py` in your adverzo-dispatch-console folder (the zip does this).
6. Check: `python admin_sync.py check`  -> "OK: connected".
7. Run `start.bat`, unlock the console with your access key. Admin > Broadcast now shows "Your PC is connected".

## Using it
Admin > Broadcast: pick Buyers / Sellers / Mediators / Everyone + filters, write the message,
tab "Auto-send from PC" > send. Try "Send test" with your own number first.

## Safety (data/admin_sync.json)
- daily_limit (60), allowed_hours ("09:00-20:00"), countdown_seconds (30, with Skip), F9 x2 stops.
- Nothing is sent while the console is locked or another run is active.
- A person is marked "sending" before the message goes out; after a crash they are marked failed
  and never auto-resent. Stop/Skip cancels the rest of the broadcast; Stop on the website stops it between people.
- "Sent" = the click/paste steps finished. WhatsApp delivery ticks can't be verified.
- The PC must be on, logged in, WhatsApp Web signed in, coordinates calibrated.
- Don't commit key.pem / cert.pem / admin_sync.json to GitHub.
