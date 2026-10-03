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
