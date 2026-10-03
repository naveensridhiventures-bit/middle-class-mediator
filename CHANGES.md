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
