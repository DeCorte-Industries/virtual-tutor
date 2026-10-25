# Math with Henry

[![Netlify Status](https://api.netlify.com/api/v1/badges/5be8146a-4a07-483e-90f1-7f04dfbb3c51/deploy-status)](https://app.netlify.com/projects/mathwithhenry/deploys)

Website for Henry Oglesby's private virtual math tutoring business: https://mathwithhenry.com

Static single-page site (HTML/CSS/JS, no build step). The published site lives in `public/`.

## License

All rights reserved — see `LICENSE`. This is proprietary code for a small business, not an open-source project.

## Owner-edited content

Henry edits the verse of the day and two notes (Math, Other topics) at `/admin/`. Content is stored in Netlify Blobs and served by two Netlify Functions in `netlify/functions/` (`/api/content` public read, `/api/admin` password-protected write). Set the `ADMIN_PASSWORD` environment variable in Netlify (Site configuration → Environment variables) before deploying. If no verse is saved, the site falls back to the built-in rotating list.

Local testing: `ADMIN_PASSWORD=something npx netlify-cli dev`.
