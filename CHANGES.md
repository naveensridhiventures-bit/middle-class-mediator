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
