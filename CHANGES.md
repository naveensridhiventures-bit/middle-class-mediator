# v3 — Admin "Broadcast" tab (bulk WhatsApp messages)

New tab in the admin dashboard: Overview · Today · Sellers · Buyers · Mediators · Matches · **Broadcast** · Published listings.

1. **Who** — Everyone / Buyers / Sellers / Mediators, then filter by Stage, Area, lead heat (Hot/Warm/Cold), property type, "registered in last 7/30/90 days", or search. Duplicate phone numbers are merged; closed leads are skipped by default.
2. **What** — starter templates + your own saved templates. Fields filled per person: {{first_name}} {{name}} {{area}} {{property_type}} {{budget}} {{sender}} and (from your Dispatch Console) {{greeting}} {{date}} {{time}}. Live WhatsApp-style preview.
3. **Send** — one big button: opens WhatsApp with the personalised message ready, you tap Send, come back, tap again. Progress bar, per-person Send / undo, tick/untick anyone.

Safety: people who already got the same message in the last 7 days are un-ticked automatically; warns above 40 recipients; optionally moves "New" leads to "Contacted" after sending.
Also: Copy numbers, Download CSV, and "Dispatch Console files" (numbers.json + message.txt in your console's format).

Files: src/lib/broadcast.js (new), src/components/admin/BroadcastBoard.jsx (new), src/pages/AdminDashboard.jsx (tab + shortcut added).
Verified: npm run build OK, no new lint warnings, tested end-to-end in a browser (desktop + mobile) with mock leads.
