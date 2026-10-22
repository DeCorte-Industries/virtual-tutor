# Math with Henry

Website for Henry Oglesby's private virtual math tutoring business: https://mathwithhenry.com

Static single-page site (HTML/CSS/JS, no build step). The published site lives in `public/`.

## License

All rights reserved — see `LICENSE`. This is proprietary code for a small business, not an open-source project.

## Owner-edited content

Henry edits the verse of the day and two notes (Math, Other topics) at `/admin/`. Content is stored in Netlify Blobs and served by two Netlify Functions in `netlify/functions/` (`/api/content` public read, `/api/admin` password-protected write). Set the `ADMIN_PASSWORD` environment variable in Netlify (Site configuration → Environment variables) before deploying. If no verse is saved, the site falls back to the built-in rotating list.

Local testing: `ADMIN_PASSWORD=something npx netlify-cli dev`.
