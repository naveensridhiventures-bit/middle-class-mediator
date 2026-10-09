# v15 — Quick call notes (hidden page for voice + number + name) (2026-10-09)

Cumulative: includes v9–v14. **This one needs a Code.gs update** (see below).

Open `/quick` on your phone (no link to it exists anywhere on the public site; also in the admin Ctrl+K menu as "Quick call notes").

- Type the number (a pasted +91 number is cleaned up), optional name, tap the mic, speak, tap stop, Save call. About 5 seconds.
- Saves on the phone first, so nothing is lost if the signal drops. Uploads in the background whenever there's signal; no duplicates if a retry happens.
- Voice recordings are stored privately in your Google Drive folder "MCM Voice Notes" (small, about 200 KB a minute). The number, name and note go in a new "QuickNotes" sheet tab.
- When you're free: a work list (oldest first) with play, 1x/1.5x/2x speed, Play all, "Not heard yet" markers, Call, WhatsApp, Copy, edit, and "Find in CRM", which opens the CRM search on that number so you can update the lead. Tick the circle when it's done.
- Undo right after saving, delete, offline indicator, works from any device you sign in on.

Apps Script (one time)
1. Replace everything in Code.gs with the new `apps-script/Code.gs`.
2. Select **authorizeVoiceNotes** in the function dropdown and click Run. Allow the Drive permission it asks for. (Do NOT run `setup` again: it resets your admin password.)
3. Deploy > Manage deployments > pencil icon > Version: **New version** > Deploy. The URL stays the same.

# v14 — Registration flows feel alive (Seller, Buyer, Mediator) (2026-10-08)

Cumulative: includes v9–v13. No Code.gs / Sheet change; the same fields are saved.

Shared by all three forms
- Slides forward and back between questions; choice cards rise in one by one, ripple, pop and draw their tick.
- Single-tap questions move on by themselves after a beat (property type, timeline, profession, promise).
- Progress is a glowing track with "Step 2 of 5" and a friendly time left.
- A "so far" strip: your answers drop in as chips as you go.
- Name and phone get a tick when valid; phone shows +91 and a live 7/10 counter.
- Pressing Continue too early shakes and says what's missing, instead of a dead button.
- Answers are saved on this device while you fill, with a "Welcome back, continue?" card if you leave.
- Saving shows a sweeping loader. Success draws a ring and tick with confetti, a "What we received" summary and a three-step "what happens next".
- Optional steps have "Skip the rest and review".

Seller form: 12 screens became 7
- Required questions are done by screen 4; the rest are optional extras.
- A "Listing strength" meter rises as optional details are added.

# v13 — Premium home page (2026-10-08)

Public home page only. Cumulative: includes v9–v12. No Code.gs / Sheet change.

- **Search dock** that pops up across the edge of the hero: pick type, budget and area, and the gallery opens already filtered (`/gallery?type=…&budget=…&area=…`).
- Hero buttons: Browse properties and Chat with us.
- **New on the market**: a swipeable rail of the newest real listings (hidden when there are none).
- **Live stats** counted up when scrolled into view (listings, areas, price range). Real data only.
- Role cards tilt in 3D with a light that follows the mouse.
- "Why people use us": three plain facts that match how the app works.
- Closing call-to-action band with slow drifting light, and footer links.
- Motion respects reduced-motion settings.

# v12 — Cleaner description + click/submit animations (2026-10-08)

Public gallery only. Cumulative: includes v9–v11. No Code.gs / Sheet change.

- **"About this property"** replaces the long Description + Seller's remark boxes. The seller's pasted text is cleaned (emoji and shouting removed) into a short intro with "Read more" and a tick-list of features with "Show all".
- **Tap ripple** on buttons, pills and chips.
- **Heart burst**: saving a property pops a spark burst and a springy heart.
- **Success moments**: Book a visit and Send Enquiry end with a self-drawing tick and confetti.
- Sheets spring up; gold buttons have a soft shine; budget pills pop when picked.
- All motion is switched off for visitors who prefer reduced motion.

# v11 — Premium Gallery (2026-10-08)

Public gallery only. No new packages, no new Sheet columns, no Code.gs change.
Cumulative: includes v9 and v10 and the Apps Script URL.

Everything shown is real listing data. Nothing is invented (no fake "3 people viewing").

**Gallery home**
- Live stats strip (properties, areas, price range) with a gold hairline
- One-tap budget pills (Under 30L … 1Cr+)
- Curated shelves built from the data: Just listed, Under 50 Lakhs, East-facing, With parking, Brand new, Plots (a shelf only shows with 2+ listings)
- Recently viewed shelf (this device only)
- Compare saved: save 2–3 listings, compare side by side, best value highlighted
- Tiles: "Just listed" badge, size and price per sq.ft

**Listing page**
- Price per sq.ft, "EMI from ₹X/mo", listed-ago
- Trust highlights (approval, loan status, vacant, parking, facing) from the seller's details
- EMI calculator: down payment, rate and tenure sliders, donut chart (indicative, assumptions editable)
- Book a visit: pick day + time, opens WhatsApp with the request written
- Similar properties shelf
- Pinned bar: Call · Book a visit · WhatsApp

# v10 — Pipeline Studio: Kanban board, Ctrl+K search, deal forecast (2026-10-08)

Builds on v9 (Command Center). No new packages, no new Google Sheet columns,
no Code.gs change. This zip is cumulative: it contains v9 and the new Apps
Script URL as well, so you can apply it on its own.

## Kanban pipeline board
- Every CRM (Sellers, Buyers, Mediators) now has a **Cards / Board** switch.
  Board shows one column per pipeline stage with the hottest leads on top.
- **Drag a card to another column** to change its stage. On a phone, use the
  stage dropdown on the card instead. The card moves instantly, and if the
  sheet rejects the change it snaps back with an error message.
- Each card shows the lead score, follow-up date (red when overdue), priority
  stars, latest note, plus one-tap WhatsApp, Call and Open.
- Your choice (cards or board) is remembered.

## Ctrl/Cmd + K search & commands
- Press **Ctrl+K** (or ⌘K) anywhere in the dashboard, or tap the search pill.
- Find any lead across all three CRMs by name, phone, ID or area; jump to any
  tab; or run quick actions (refresh, export CSV, field visit, gallery,
  log out). Arrow keys + Enter, Esc to close.
- Picking a lead switches to the right tab and opens its detail panel.

## Overview additions
- **Deal forecast** — expected and best-case commission from live seller
  leads, weighted by lead score, with your commission % (remembered). The top
  five deals are listed with their likelihood bar.
- **Recent activity** — a live feed of registrations, notes and site visits.
  Click any row to open that lead.
- **Data health** — duplicate phone numbers (and people who are both buyer and
  seller), active leads with no phone, and active leads with no follow-up
  date. Click a name to open it.
- **Export CSV** for Sellers, Buyers and Mediators (opens in Excel, includes
  each lead's score and last note).

## Also included from v9 (cumulative)
Overview / Today / Matches tabs, Hot-Warm-Cold lead score, WhatsApp template
menu, sort options, overdue-logic fix, lazy-loaded pages and PDF library, and
the new Apps Script URL in src/lib/config.js.

## New files
`src/components/admin/KanbanBoard.jsx`, `CommandPalette.jsx`,
`OverviewExtras.jsx`, `src/lib/exportCsv.js`

# v9 — Command Center: insights, daily follow-up queue, smart matching (2026-10-08)

Adds three new admin views and a lead-scoring engine on top of v8. No new
packages, no new Google Sheet columns, no backend (Code.gs) change — it all
runs on the data you already collect. Public pages and the gallery are
untouched. Cumulative: includes all earlier updates.

## New admin tabs (Dashboard)
- **Overview** — animated hero with a plain-English summary of your day, six
  KPI tiles (total leads, new this week vs last, hot leads, follow-ups due,
  combined listing value, ready matches), 14-day lead-intake chart, a
  pipeline funnel for each role, and a **Demand vs supply** panel (by
  property type, budget band and area) that spells out the gaps, e.g. "2
  buyers want Office space but only 0 sellers are listed". Plus "Hottest
  leads" and "Needs you today" with one-tap WhatsApp / Call.
- **Today** — the daily follow-up queue: Overdue, Due today, Coming up (next
  3 days) and "Needs a follow-up date" (hot or going cold with nothing
  scheduled). Each row has WhatsApp (with message templates), Call, and a
  **Log** panel: add a note, pick Tomorrow / 3 days / 1 week / 2 weeks (or a
  date) and save — the note goes into the remarks history and a "New" lead
  moves to Contacted. A badge on the tab shows how many need you now.
- **Matches** — pairs every active buyer with properties (and every property
  with buyers) on type, budget, area and how soon both sides can move, with
  a 0–100 score and the reasons. "Send to <buyer>" opens WhatsApp with the
  pitch pre-written (includes the gallery link when the property is
  published; never includes the owner's name, phone or exact address).

## Lead cards
- **Lead score** badge (Hot / Warm / Cold · 0–100) on every card; hover shows
  why. Based on timeline urgency, priority stars, budget stated, how
  complete the details are, reachability and recent activity.
- **WhatsApp template menu** on every card (follow-up, price check, site
  visit, ask for photos, loan help, welcome…), pre-filled with the lead's
  details. Nothing is ever sent automatically.
- **Sort** — Newest, Hottest first, Follow-up soonest, Highest priority.

## Fixed
- **Overdue logic**: a Buyer marked "Worthless" (or a Mediator "Visited" /
  "Not worth", or a sold-out Seller) no longer shows "Overdue" forever. The
  old check only knew the retired "Closed"/"Dropped" stages.

## Faster
- Every page except the home page now loads on demand (route splitting).
- The PDF library (jsPDF) loads only when you actually download a PDF: the
  admin bundle dropped from about 550 kB to about 120 kB.
- Overview, Today and Matches share one parallel fetch of all three sheets
  and refresh quietly every 2 minutes.

## New files
`src/lib/insights.js`, `src/lib/useAllLeads.js`, `src/lib/roles.js`,
`src/components/admin/CommandCenter.jsx`, `TodayBoard.jsx`,
`MatchesBoard.jsx`, `insightUi.jsx`

# v8 — Gallery: first zip's opening page + second zip's inside pages (2026-10-03)

Opening page (/gallery) is the animated design from the first zip, without
the bottom button bar. Inside pages are the second zip's. Home page, forms
and admin are untouched. Cumulative: includes all earlier updates.

## Opening page
- MCM header with back and search, "Property Gallery" rising into place, the
  subtitle rolling through homes / flats / villas / plots / shops.
- Icon chips that glide in one by one, Featured slider (slow push-in, rising
  title words, progress dots, swipe), ribbon of area names, Recent listings
  tiles with price, heart and photo count, count-up number, sort.
- Price / size / facing filters now live inside the search panel (tap the
  search button, then the sliders button), so the opening screen stays clean.
  A note under the chips shows when filters are on, with "Clear filters".

## Kept from the second zip (unchanged)
- Property page, full-screen photo viewer, Photos and Location tabs, Enquiry
  (opens WhatsApp with the message ready), Filters sheet, saved hearts,
  return-to-same-place scrolling.

## Removed
- The bottom button bar (BottomNav), and the second zip's card/tile-strip
  components that the opening page no longer uses
  (`ListingCards.jsx`, `CategoryStrip.jsx`).

## Fixed
- Featured slider was narrower than the page on desktop (a height cap was
  shrinking its width); it now fills the column.
- Slider handles show their own focus ring instead of a box around the track.
- Long chip names such as "Independent House" wrap onto two lines.

# v7 — Gallery pages rebuilt to the new mockup (2026-10-03)

Only the gallery changed. Home, Buyer, Seller, Mediator and the admin are
untouched (the only other edits are two new routes in App.jsx and extra
styles appended to index.css). Cumulative: includes all earlier updates.

## Gallery list  (/gallery)
- Light header (back, title, saved-hearts button), search box with a moving
  placeholder ("Search homes… flats… plots…") and a Filters button with a
  badge showing how many filters are on.
- Dark strip of property-type tiles with icons.
- Featured Properties: big cards with photo, title, area, price and a specs
  row (built only from data the listing really has). "View All" jumps to the grid.
- All Properties grid: photo with heart, then title, area and price; sort on the right.
- Bottom bar: Home, Gallery, a gold "+" (list your property), Chat (WhatsApp)
  and Saved (your hearts).
- Returning from a listing puts you back exactly where you were.

## Filters sheet
- Property type tiles, area, price range slider (₹20 Lakhs to ₹5+ Crores),
  size slider (500 to 5000+ Sq.ft), facing, Reset, and a live "Show Results (N)".

## Property page  (/gallery/:id)
- Full-width swipeable photo with back, heart, share and a photo counter;
  title, area, price, specs cards, description, seller's remark, details.
- Pinned Call and WhatsApp buttons. Tap the photo for the full-screen viewer.

## New pages
- Gallery view (full-screen viewer with thumbnails, swipe, keyboard).
- /gallery/:id/photos: all photos in a grid, plus a Location tab with an area map.
- /gallery/:id/enquiry: name, phone, message; opens WhatsApp with the message ready.

## Fixed along the way
- Price reader now understands ranges like "₹75 Lakhs–₹1 Crore" (it used to
  read the 75 as crores, which skewed sorting).

## Removed (replaced by the above)
`components/gallery/FeaturedCarousel.jsx`, `PropertyTile.jsx`, `ShowcaseHeader.jsx`

# v6 — New property gallery (2026-10-03)

Cumulative: includes the home page, admin and public redesigns and the gallery
touch fix, so this zip can be applied on its own.

## Gallery (matches the design mockup)
- Dark header with the blurred photo, back arrow, MCM mark and a search button
  that slides the search box open.
- Title "Property Gallery" rises into place; the subtitle rolls through
  homes / flats / villas / plots / shops.
- Category chips with icons and counts, built from the types actually listed,
  stuck to the top while you scroll (soft shadow once stuck).
- **Featured slider**: crossfades through the newest listings with a slow
  push-in, title words that rise on every slide, dots that fill like a timer,
  swipe on phones, arrows on desktop, a gentle 3D tilt toward the mouse.
- A ribbon of area names (taken from the real listings) drifts across.
- **Recent listings** as photo tiles: price, photo count, heart. On a computer
  hovering cycles through the listing's photos. Tiles scale in as you scroll.
- **Hearts**: save listings on the phone (no account), see them under "Saved".
- Number of listings counts up; sort sits beside the heading.
- Returning from a listing puts you back at the same place in the list.

## Property page
- Same header, with Share (phone share sheet, or copies the link) and a heart.

## Notes
- Cards no longer carry the WhatsApp button; it is on the property page in
  the bar pinned to the bottom. Seller remarks and details are there too.
- Everything respects "reduce motion".
- `HERO_IMAGE` now lives in `src/lib/brand.js` (used by home and gallery).

# v5 — Animated home page (2026-10-03)

Cumulative: includes the public redesign, the admin redesign and the gallery
touch fix, so this zip can be applied on its own.

## Home page
- New layout matching the design mockup: darkened dusk photo hero, gold MCM
  logo, cream sheet with three tinted role cards and a dark gallery card.
- **Moving words**
  - "The trusted way to…" with a rolling line: buy a home. / sell a flat. /
    find a plot. / list a shop. / close a deal.
  - Title words rise out of a mask; "Mediator" carries a gold shimmer sweep
  - Tagline appears one phrase at a time
  - A slow ticker ribbon of property types (Homes, Flats, Villas, Plots & Lands…)
- **Motion**: logo spins in with a slowly orbiting ring and soft glow, gold
  lights drift upward, the photo slowly pushes in, and the hero scrolls with
  parallax (photo drifts slower than the page, text lifts and fades).
- **Cards**: staggered entrance; on a mouse, a light sweeps across the card,
  the icon tilts and the arrow fills in. On touch, no sticky hover effects.
- **How it works**: three steps; the gold line draws and the numbered badges
  pop in as the section scrolls into view.
- **WhatsApp button** appears once you scroll past the hero.
- Everything respects "reduce motion": those visitors see the finished page,
  fully visible, with no movement.
- Swap the photo any time: change `HERO_IMAGE` at the top of `src/pages/Home.jsx`.

# v4 — Admin redesign (2026-10-03)

Cumulative: includes the public redesign (v3) and the gallery touch fix, so
this zip can be applied on its own.

## Admin (command center) now matches the public screens
- **Command center**: brand bar with shortcuts (Field visit, Gallery, Log out),
  tabs for Sellers / Buyers / Mediators / Published listings, and a plain
  "Your name" box for the name shown on remarks.
- **Lead list**: clear cards with status pill, phone, stars, follow-up date,
  latest remark, and big WhatsApp / Call / Open details buttons. Leads with
  no phone get greyed-out buttons instead of a dead link.
- **Status chips** scroll sideways with counts; search sits right below.
- **Filters** open in their own panel (area, budget, size, and every facet as
  tap-able chips with counts) with "Clear all" and "Show N".
- **Lead details** open as a bottom sheet on phones. Instead of one very long
  form, sections fold open and closed: Contact & pipeline, Remarks, Photos,
  Submitted details, Area & size, Exact location, Custom fields, Buyer gallery.
  Save, Admin PDF, Customer PDF and Delete stay pinned at the bottom.
  Photo remove buttons are always visible (they used to need a mouse hover).
- **New field visit**, **Published listings** and the **Field visit page**
  restyled the same way. Listing removal is two taps instead of a browser pop-up.
- Every action (save, remarks, photos, gallery share/update, copy link, PDFs,
  delete, filters, custom fields) works exactly as before.
- Fixed: the lead filters didn't list all their dependencies (could show a
  stale list in rare cases). Lint is now fully clean (0 warnings).

# v3 — Full UI redesign + gallery touch fix (2026-10-03)

Cumulative: includes the earlier gallery image-glitch fix, so this zip can be
applied on its own.

## Redesign (matches the "Buyer experience" mockup)
- **Buyer, Seller and Mediator are now step-by-step flows**: landing → one
  question group per screen → review → success. Same fields, same options,
  same data sent to the Google Sheet.
  - Dark brand bar with a coloured "M" chip that changes colour each step
  - Progress bar, big tap-to-choose option cards (radio dot → tick)
  - Continue is disabled until the step is valid; the footer stays pinned
    to the bottom of the phone screen
  - Phone must be 10 digits (clear message while incomplete)
  - Seller's optional questions can be skipped
  - Review screen: tap any row to edit it, then "Save changes" returns to review
  - Success screen with "Register another" / "Back to home"
- **Home**: hero photo kept; role picker is now a cream sheet with three clear
  cards plus a "Browse the property gallery" card.
- **Gallery**: same search/sort; property-type filter chips are now always
  visible; calmer cards with "Details" and "I'm interested" buttons; no more
  hover-lift animation. "Register now" now links inside the app.
- **Property page**: pinned bar with the price and the WhatsApp button.
- **Admin login** restyled to match. The admin CRM itself is unchanged.
- Small text colours darkened to meet contrast guidelines.

## Gallery touch fix (from v1 of the glitch fix)
- Lightbox renders at the page level (it was trapped inside a transformed card)
- Swipe no longer counts as a tap; hover effects only on devices with a mouse
- Next/previous photo preloaded; images can't be dragged or long-press-previewed

## Removed (no longer used)
`src/components/RadioGroup.jsx`, `BackHome.jsx`, `Seal.jsx`

# v2 — Scroll animations & movement (2026-09-11)

This zip is cumulative — it includes everything from v1 (bug fixes / UI
polish) plus this pass's animation work. You can apply this zip on its own
even if you haven't applied v1 yet.

## New in v2: scroll-reveal animation system
Added a lightweight, dependency-free scroll-reveal component
(`src/components/Reveal.jsx`) using `IntersectionObserver` — no animation
library, no extra bundle weight. Elements fade and slide into place the
first time they scroll into view, respecting `prefers-reduced-motion`.

Applied across the site:
- **Home** — hero content fades in on load, the three role cards
  (Seller/Buyer/Mediator) cascade in with a staggered delay as the page
  loads, hover states got a bit more life (icon rotates, underline grows,
  card scales slightly), and a subtle bouncing scroll-cue arrow was added
  to the hero.
- **Gallery** — header and the gold CTA banner reveal in, and each listing
  card now animates in as you scroll down the grid (staggered by column)
  instead of all firing at once on page load.
- **Property Detail** — the photo carousel and the info panel below it
  reveal in sequence.
- **Seller / Buyer / Mediator forms** — the long forms are broken into
  logical sections (basic info, property details, dimensions, approvals,
  pricing, etc.) that each fade/slide in as you scroll down, so filling
  out a long form feels considerably less like a static wall of fields.

## Included from v1 (see previous notes)
- Fixed mobile photo carousel (arrows were hover-only, invisible on touch;
  added swipe support).
- Required fields now actually show `*` to match the form copy.
- Added Home links on Seller/Buyer/Mediator so they're not a dead end.
- Added a Gallery link from the Home page footer.
- Skeleton loading states and consistent error banners.
- Digit-only phone inputs, admin login polish, removed a stray code
  artifact in `config.js`.

## Verified
`npm run build` completes cleanly and `npm run lint` shows the same 6
pre-existing warnings as before (all in the untouched admin CRM file) —
no new errors or warnings introduced.

## Not touched
The admin CRM (`src/components/admin/CRMBoard.jsx`) — large, internal-only
tool, intentionally left alone to avoid risk. Happy to do a dedicated pass
on it if you'd like matching animations there too.

## v15.2 — instant saving
- Saving a call shows at once; storage and upload finish in the background (no waiting on the network).
- A save during a running sync no longer waits for it; it uploads right after, and skips the slow full-list read.
- Apps Script: faster duplicate check (reads one column) and remembers the voice-notes folder.

## v15.3 — shared across logged-in devices
- Saving sends number + name first (fast), then attaches the recording, so other devices see the call within seconds.
- Every open /quick page checks a tiny version counter every 3 s (only while visible) and fetches the list only when it changed.
- Apps Script: quickVersion, attachQuickAudio actions; version bumps on add/update/delete.

## v15.4
- Apps Script URL updated to the new deployment.
