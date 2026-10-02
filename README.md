# Math with Henry — Tutoring Website

Website for Henry Oglesby's private math tutoring business — virtual sessions
(online only), Algebra 1 through Calculus AB.

**Live at:** https://mathwithhenry.com (hosted on Netlify, deployed from this repo's `master` branch)

## What's in this folder

- `public/` — the published site (Netlify's publish directory, set in `netlify.toml`). Nothing outside this folder is served.
  - `public/index.html` — the website itself. Single page, no build step, no dependencies.
  - `public/images/` — site images and favicon.
- `netlify.toml` — tells Netlify to publish only `public/`.
- `deployment-steps.md` — step-by-step guide from zero to a live site: domain, hosting, DNS, forms, booking.
- `LICENSE` — usage terms for this repository.

The following files are for internal planning only and are excluded from version control (see `.gitignore`) since they contain personal contact details and unpublished business info:
- `site-change-plan.md` — maps Henry's answers to specific site changes.
- `open-items.md` — checklist of details still pending from Henry before launch.
- `questions-for-henry.md` — the intake questions originally sent to Henry.

## Running it locally

No build tools required. Either open `public/index.html` directly in a browser, or serve it:

```
python3 -m http.server 8000 --directory public
```

Then visit `http://localhost:8000`.

## Deploying

See `deployment-steps.md` for the full path to a live site — registering the domain, hosting on Netlify, connecting DNS, and wiring up the contact form and booking link.

## Status

Live. Remaining items are tracked in `open-items.md` (local only): PayPal Business account conversion, Henry's verse-list preference, and more testimonials.

## License

All rights reserved — see `LICENSE`. This is proprietary code for Henry Oglesby's
tutoring business, not an open-source project.
