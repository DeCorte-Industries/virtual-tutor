# Math with Henry — Tutoring Website

Website for Henry Oglesby's private math tutoring business — virtual sessions
(with in-person available at the local library), Algebra 1 through Calculus AB.

**Planned domain:** mathwithhenry.com *(not yet registered — see `deployment-steps.md`)*

## What's in this folder

- `index.html` — the website itself. Single page, no build step, no dependencies.
- `deployment-steps.md` — step-by-step guide from zero to a live site: domain, hosting, DNS, forms, booking.
- `LICENSE` — usage terms for this repository.

The following files are for internal planning only and are excluded from version control (see `.gitignore`) since they contain personal contact details and unpublished business info:
- `site-change-plan.md` — maps Henry's answers to specific site changes.
- `open-items.md` — checklist of details still pending from Henry before launch.
- `questions-for-henry.md` — the intake questions originally sent to Henry.

## Running it locally

No build tools required. Either open `index.html` directly in a browser, or serve it:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying

See `deployment-steps.md` for the full path to a live site — registering the domain, hosting on Netlify, connecting DNS, and wiring up the contact form and booking link.

## Status

Design and core content are in place. Still pending before launch — see `open-items.md`:
group session pricing, Saturday/Sunday availability, Zelle/PayPal handles, a headshot photo, real testimonials, and Henry's sign-off on his personal bio.

## License

All rights reserved — see `LICENSE`. This is proprietary code for Henry Oglesby's
tutoring business, not an open-source project.
