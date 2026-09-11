# UI polish & bug fixes — v1 (2026-09-11)

## Bugs fixed
- **Mobile carousel was unusable for browsing photos.** The prev/next arrows on
  every property image carousel only appeared on `:hover`, which never fires
  on a touch screen — mobile visitors had no way to move through a listing's
  photos except the tiny dot indicators. Arrows are now visible on mobile and
  a proper left/right swipe gesture is supported. (`Carousel.jsx`)
- **Form copy promised something that didn't exist.** The Seller form told
  people "the starred fields are required" but no field anywhere in the app
  actually had a star. Required fields on Seller/Buyer/Mediator now show a
  real `*` marker, and the helper copy matches reality.
  (`Seller.jsx`, `Buyer.jsx`, `Mediator.jsx`, `RadioGroup.jsx`)
- **Registration pages were a dead end.** Seller/Buyer/Mediator had no link
  back to the home page — only the browser back button worked. Added a
  "Home" link at the top of each form and on the success screens.
- **Gallery was unreachable from the home page.** There was no link anywhere
  on the home screen to the property gallery. Added a footer with a link to
  `/gallery`. (`Home.jsx`)
- **Leftover code artifact** — a stray pair of backticks left in
  `src/lib/config.js` from a previous edit, removed.
- Phone number fields now restrict input to digits only (10-digit pattern)
  instead of accepting any free text.

## Polish / professionalism
- Replaced plain "Loading…" text with skeleton-loading placeholder cards
  (shimmer animation) on the Gallery and Property Detail pages, so the page
  doesn't look broken/empty while data loads.
- Replaced plain red error text with a consistent, icon-led error banner
  style (`.alert-error`) used across Gallery, Property Detail, Seller,
  Buyer, Mediator, and Admin login.
- Admin login page given basic branding and centered on the page instead of
  floating unstyled near the top.
- Gallery logo mark is now clickable, linking back to the home page (a
  standard convention that was missing).

## Not touched in this pass
- The admin CRM board (`src/components/admin/CRMBoard.jsx`) is a large,
  business-critical internal tool. It wasn't touched in this pass to avoid
  risk — let me know if you'd like a follow-up pass focused on it
  specifically.

## How to apply
This zip only contains the files that changed — copy them into your project
root (overwriting the old versions) and commit. See the PowerShell command
block provided alongside this zip.
