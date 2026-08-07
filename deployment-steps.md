# From Zero to Live: Deploying the Henry Oglesby Tutoring Site

This assumes nothing exists yet — no domain, no hosting account, no live site. The design mockup (`index.html`) is a static site (plain HTML/CSS/JS), so hosting is simple and cheap: roughly $10–15/year for a domain, $0/month for hosting.

## Phase 1 — Finalize content

1. Open `index.html` and replace every placeholder:
   - The "Photo of Henry" box in the About section → a real headshot.
   - Sample testimonials → real parent/student quotes (or remove the section until you have some).
   - The Calendly link (`href="#"` in the Contact section) → your real booking link (Phase 3).
   - The Venmo/Zelle note → your actual handle.
2. Proofread copy and confirm the phone number and course list are correct.

## Phase 2 — Register a domain

3. Pick a domain name (e.g. `henryoglesbymath.com`, `mathwithhenry.com`, `oglesbytutoring.com`). Check availability at a registrar.
4. Register it through a registrar such as **Namecheap**, **Cloudflare Registrar**, or **Porkbun** — all ~$10–15/year with no markup tricks. Avoid registrars that upsell heavily (e.g. GoDaddy) unless price doesn't matter to you.
5. Keep the registrar login handy — you'll return here in Phase 5 to point the domain at your host.

## Phase 3 — Wire up booking, contact, and payment

6. **Scheduling:** Create a free [Calendly](https://calendly.com) account. Set up two event types — "Free intro call" (15 min) and "Tutoring session" (e.g. 60 min) — and copy the booking link into the site's Contact section.
7. **Contact form:** The form in `index.html` has no backend yet. Pick one:
   - **Netlify Forms** (easiest if hosting on Netlify — see Phase 4): add `name="contact"` and a `data-netlify="true"` attribute to the `<form>` tag. No extra signup needed.
   - **Formspree**: sign up free, get a form endpoint URL, set it as the form's `action`.
8. **Payment:** No processor is required to start — collect payment via Venmo or Zelle after a session is booked, as noted on the site. If you later want in-site payment links, Stripe Payment Links is the simplest upgrade (no code changes needed beyond adding a button).

## Phase 4 — Choose a host and deploy

9. Create a free account on **[Netlify](https://netlify.com)** (recommended — free tier, automatic HTTPS, easiest custom-domain setup). GitHub Pages or Vercel are equally valid alternatives.
10. (Recommended) Put the site in a GitHub repository first, so future edits redeploy automatically:
    - Create a free GitHub account and a new repository (e.g. `henry-tutoring-site`).
    - Upload `index.html` to it (via GitHub's web "Add file" button, or `git init` / `git add` / `git commit` / `git push` from a terminal).
11. In Netlify, choose **"Add new site" → "Import from Git"** and connect the GitHub repo, or simply **drag-and-drop the `index.html` file** onto Netlify's deploy screen if you'd rather skip GitHub.
12. Netlify gives you a live URL immediately (e.g. `random-name-123.netlify.app`). Open it and confirm the site looks right.

## Phase 5 — Connect the domain and go live

13. In Netlify: **Site settings → Domain management → Add a domain** and enter your registered domain.
14. Netlify shows DNS records to add. Go back to your registrar (Phase 2) and either:
    - Point the domain's **nameservers** to Netlify (simplest, Netlify manages everything), or
    - Add the specific **A/CNAME records** Netlify gives you, if you want to keep DNS at the registrar.
15. Wait for DNS to propagate (usually under an hour, can take up to 24–48 hours). Netlify auto-issues a free HTTPS certificate once it detects the domain is pointed correctly — confirm the padlock shows in the browser.

## Phase 6 — Test and launch

16. On a phone and a laptop, check: every nav link scrolls correctly, the "Call" and "Text" buttons open the right app, the Calendly link opens the real booking page, and the contact form actually delivers a test message.
17. Run the live URL through Google's PageSpeed Insights or Lighthouse (built into Chrome DevTools) as a quick sanity check.
18. Once satisfied, share the domain: update the business card, any social profiles, and email signature with the new URL.

## Optional polish (not required to launch)

- **Analytics:** add a lightweight, privacy-friendly tracker like Plausible, or Google Analytics if preferred — one script tag in `index.html`.
- **Professional email:** set up `henry@yourdomain.com` via Google Workspace (~$6/mo) or Zoho Mail (free tier) once the domain is live.
- **Local visibility:** create a free Google Business Profile listing for search/maps presence.
- **Ongoing:** domain renews annually (set a calendar reminder); revisit testimonials and availability periodically.
