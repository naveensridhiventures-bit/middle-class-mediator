# Middle Class Mediator

A PWA for your Instagram property-video workflow: **Mediator**, **Seller**, and
**Buyer** each fill their own form; everything is stored in a Google Sheet;
you (admin) manage it all from a hidden dashboard and follow up over WhatsApp.

- **Frontend:** React + Vite, installable as a PWA on phones
- **Database:** Google Sheets (free, no server to maintain)
- **Images:** Cloudinary (free tier)
- **Contact:** WhatsApp deep links (`wa.me`) + tap-to-call

No setup step below needs coding experience — it's mostly copy/paste and
clicking buttons. Do them in order.

---

## 1. Create the Google Sheet + backend (Apps Script)

1. Go to sheets.google.com → **Blank spreadsheet**. Rename it to
   `Middle Class Mediator Data`.
2. In the sheet, go to **Extensions → Apps Script**. Delete any starter code
   in `Code.gs`, then paste in the entire contents of this project's
   `apps-script/Code.gs` file.
3. In the function dropdown at the top (next to the Run/Debug icons), select
   **`setup`**, then click **Run** (▶). The first time, Google will ask you
   to authorize the script — accept it (it only touches this one sheet).
   - Before running, open `Code.gs` and change `"changeme123"` to your own
     admin password.
4. Back in the Apps Script editor, click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" → choose **Web app**.
   - Description: anything, e.g. "MCM API"
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize again if asked.
5. Copy the **Web app URL** it gives you (ends in `/exec`). You'll paste this
   into the app's config in step 3 below.
6. Go back to the spreadsheet — you'll see tabs appear automatically the
   first time each is used: `Mediators`, `Sellers`, `Buyers`, `Properties`.

> Whenever you edit `Code.gs` later, you must click **Deploy → Manage
> deployments → Edit (pencil) → New version → Deploy** for changes to go live.

---

## 2. Set up Cloudinary (for property photos)

1. Create a free account at cloudinary.com.
2. On your Cloudinary dashboard, copy your **Cloud name**.
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
   - Set **Signing Mode** to **Unsigned**.
   - Save, then copy the preset name.

---

## 3. Configure the app

Open `src/lib/config.js` and fill in the four values:

```js
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
export const CLOUDINARY_CLOUD_NAME = "your-cloud-name";
export const CLOUDINARY_UPLOAD_PRESET = "your-preset-name";
export const ADMIN_WHATSAPP_NUMBER = "919876543210"; // your number, no + or spaces
export const MEDIATOR_WHATSAPP_NUMBER = "918838660663"; // mediator's number — sellers message this directly
```

---

## 4. Run it locally

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. Try the Mediator, Seller and Buyer flows.

---

## 5. Deploy so you can share a real link

Easiest options (both free, both work great with Vite):

**Vercel**
```bash
npm install -g vercel
vercel
```

**Netlify**
```bash
npm run build
# then drag the generated `dist` folder into app.netlify.com/drop
```

Once deployed, share `https://your-app-url.com` on your Instagram bio/story —
that's the link customers, mediators, and sellers use.

---

## 6. Using the app

### Public pages (linked from the home screen)
- `/mediator` — mediator/agent/builder/developer registers on the network (profession, area,
  category, experience, deal type, genuine-leads pledge)
- `/seller` — seller registers their property (type, location, status, expected price,
  ownership, timeline)
- `/buyer` — buyer registers what they're looking for (property type, purpose, budget,
  preferred location, loan requirement, timeline)

- **Seller** forms end with a **"Message the mediator on WhatsApp"** button that opens a
  pre-filled WhatsApp chat straight to the mediator's number (`MEDIATOR_WHATSAPP_NUMBER`
  in `config.js`), so only sellers can message the mediator directly.
- **Buyer** and **Mediator** forms only **submit a report** — everything is saved to the
  Google Sheet, but there's no WhatsApp button; the admin follows up from the CRM instead.

### Hidden admin pages (not linked anywhere in the UI — bookmark them)
- `/control` — admin login (the password you set in step 1.3)
- `/control/dashboard` — **three separate CRMs** (Seller CRM, Buyer CRM, Mediator CRM),
  each color-coded, with live stat/status pills, search, an **e-commerce-style
  advanced filter panel** — filter by area/locality, budget range, property
  size (sqft), and any **custom field** you've tagged onto leads (add any
  attribute you need, like "Facing" or "Furnishing", from a lead's detail
  panel — it automatically becomes a checkbox facet with counts across all
  leads, so you can narrow 1,000 leads down to one in a few clicks), per-lead
  status pipeline (New → Contacted → In progress → Closed → Dropped), a
  5-star priority rating, a next-follow-up date picker (flagged as
  **Overdue** once it passes), and a full-detail **View & edit** panel per
  lead where the admin can edit every submitted field (name, phone, and all
  the role-specific details) plus admin-only metadata (area, budget, sqft,
  custom fields) used for the filters — none of this overwrites the dated
  **remarks history** (every note you add is kept, never overwritten, and
  the latest one shows right on the lead card for quick reference), one-tap
  call/WhatsApp, and a **Download report** button that exports the currently
  filtered leads as a polished PDF with each lead's full remarks history —
  plus a separate "Published listings" tab if you want to curate properties
- **Site visits (Seller CRM only)** — at the top of a seller lead's detail
  panel, tap "Take photo" (opens the phone's camera), then "Log this visit"
  — it captures GPS location, reverse-geocodes it into a readable address
  (via OpenStreetMap, free/no API key needed), uploads the photo to
  Cloudinary, and saves it all with a date/time stamp. Every past visit
  stays listed (photo thumbnail, address, date/time, who logged it) —
  nothing gets overwritten.
- Errors from any admin action (saving details, adding a remark, logging a
  visit) now show directly in the panel instead of failing silently — if
  something's wrong (e.g. the Apps Script deployment needs redeploying, or
  its "Who has access" isn't set to "Anyone"), you'll see a clear message.

Since every submission is saved instantly to your Google Sheet, you always
have the full record even before you check WhatsApp — this is what answers
"which customer approached for which Insta video," using the **Insta
reference** field mediators fill in.

---

## Install as an app (PWA)

On a phone, open the deployed link in Chrome/Safari → menu → **Add to Home
Screen**. It'll behave like a native app with its own icon, and works
offline for pages already visited.

---

## Notes on security

- The admin password is checked on the server (Apps Script) for every admin
  action — it's not just hidden in the frontend.
- `/control` isn't linked from the UI, but it isn't secret either (anyone
  who guesses the URL can try a password). For a customer-facing lead-gen
  tool this is normal; if you want stronger protection later, Google Apps
  Script also supports Google-account-based access restrictions.
- Change the default password in `Code.gs` before you deploy.

---

## Project structure

```
src/
  lib/
    config.js       — your 4 config values
    api.js          — talks to the Apps Script backend
    cloudinary.js    — image upload
    whatsapp.js      — wa.me / tel: link builders
  components/
    Seal.jsx         — the stamp/seal signature graphic
    Header.jsx
    ImageUploader.jsx
    admin/
      LeadsTab.jsx
      PropertiesTab.jsx
  pages/
    Home.jsx         — role picker
    Mediator.jsx
    Seller.jsx
    Buyer.jsx
    AdminLogin.jsx
    AdminDashboard.jsx
apps-script/
  Code.gs            — paste into Google Sheets → Extensions → Apps Script
```
