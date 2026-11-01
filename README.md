# Math with Henry

[![Netlify Status](https://api.netlify.com/api/v1/badges/5be8146a-4a07-483e-90f1-7f04dfbb3c51/deploy-status)](https://app.netlify.com/projects/mathwithhenry/deploys)

Website for Henry Oglesby's private virtual math tutoring business: https://mathwithhenry.com

Static single-page site (HTML/CSS/JS, no build step). The published site lives in `public/`.

## License

All rights reserved — see `LICENSE`. This is proprietary code for a small business, not an open-source project.

## Owner-edited content

Henry edits the verse of the day and two notes (Math, Other topics) at `/admin/`. Content is stored in Netlify Blobs and served by two Netlify Functions in `netlify/functions/` (`/api/content` public read, `/api/admin` password-protected write). Set the `ADMIN_PASSWORD` environment variable in Netlify (Site configuration → Environment variables) before deploying. If no verse is saved, the site falls back to the built-in rotating list.

Local testing: `ADMIN_PASSWORD=something npx netlify-cli dev`.

### The Top Five

Henry also edits "The Top Five" at `/admin/`: up to five worked problems (problem, one solution step per line, optional answer) for each subject, starting with Algebra 1. He can add, rename, reorder, and remove subjects there. It is stored under its own blob key (`topFive`) so it never overwrites the verse and notes. The home page reads it from `/api/top-five`; the admin uses the `topFiveLoad` and `topFiveSave` actions on `/api/admin`. Validation lives in `netlify/functions/lib/top-five.mjs`. Math can be typed plainly (x², √, ≤) or as LaTeX inside `\(` `\)` or `\[` `\]`, which the page typesets with KaTeX (loaded only when needed).
