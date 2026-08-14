# From Zero to Live: Deploying the Henry Oglesby Tutoring Site

This assumes nothing exists yet — no domain, no hosting account, no live site. The design mockup (`index.html`) is a static site (plain HTML/CSS/JS), so hosting is simple and cheap: roughly $10–15/year for a domain, $0/month for hosting.

## Phase 1 — Finalize content

1. Open `index.html` and check what's still pending — see `open-items.md` for the current list (currently: real testimonials, Henry's bio sign-off, two charity logos, the Cal.com link, and confirming the PayPal account is Business).
2. Proofread copy and confirm the phone number and course list are correct.

## Development previews (Vercel) — optional, do this before or during Phase 2

While you're still editing content, it's useful to have a shareable preview link without touching a real domain or production host. Vercel is well-suited for this and is free for this use case.

- **D1.** Put the site in a GitHub repository (private is fine — see the license note in `README.md`): create a free GitHub account, make a new repo (e.g. `virtual-tutor`), and push `index.html` to it. (This is the same repo you'll reuse for production hosting in Phase 4 — no need to do it twice.)
- **D2.** Create a free account at **[vercel.com](https://vercel.com)**, signing in with GitHub.
- **D3.** Click **"Add New… → Project"**, import the repo, and deploy. No build command or output directory is needed — it's a plain static HTML site, so Vercel's defaults work as-is.
- **D4.** Vercel deploys immediately to a temporary URL like `virtual-tutor.vercel.app`. Send this to Henry to review before anything is public on the real domain.
- **D5.** Every push to the repo creates a fresh preview deployment with its own URL, so you can compare versions without overwriting anything — handy while working through the items in `open-items.md`.
- **D6.** This is a development step, not a production choice: once the site is ready to launch, continue with Phase 4 below (Netlify) for the live domain. If you'd rather use Vercel for production too, that's equally valid — Phase 4 and 5's "connect a custom domain" steps work almost identically on Vercel, just substitute Vercel's dashboard for Netlify's.

## Phase 2 — Register a domain

3. Pick a domain name (e.g. `henryoglesbymath.com`, `mathwithhenry.com`, `oglesbytutoring.com`). Check availability at a registrar.
4. Register it through a registrar such as **Namecheap**, **Cloudflare Registrar**, or **Porkbun** — all ~$10–15/year with no markup tricks. Avoid registrars that upsell heavily (e.g. GoDaddy) unless price doesn't matter to you. *(If you'd rather bundle the domain with hosting in one place, see the "Alternative path — Porkbun bundle" section after Phase 5 instead of doing this step separately.)*
5. Keep the registrar login handy — you'll return here in Phase 5 to point the domain at your host.

## Phase 3 — Wire up booking, contact, and payment

6. **Scheduling:** Create a free [Cal.com](https://cal.com) account. Set up event types matching the site's rates — "10-minute intro call," "1-hour session," "2-hour session," and "Group session" — and copy the booking link into the site's Contact section. (Cal.com is open-source and generally has a more generous free tier than Calendly, which is why it replaced Calendly in this plan.)
7. **Payment:** Zelle (470-841-2774) and `paypal.me/MrO1976` are already on the site — see `open-items.md` for the one thing still pending (converting the PayPal account from personal to Business before real payments start).

There's no contact form on the site — it was removed in favor of direct text/voicemail/email/Cal.com links, so there's no form backend (Netlify Forms, Formspree, etc.) to set up.

## Phase 4 — Choose a host and deploy (Netlify path)

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

## Alternative path — Porkbun bundle (domain + hosting together)

If you'd rather manage the domain and hosting in one place instead of splitting them between a registrar and Netlify, Porkbun's Secure Static Hosting + Domain Bundle covers both. This **replaces Phases 2, 4, and 5 above** — do this instead, then continue on to Phase 6.

- **P1.** Go to [porkbun.com](https://porkbun.com) → Web Hosting → Static Hosting, and choose the "Secure Static Hosting + Domain Bundle." Search for your domain (e.g. `mathwithhenry.com`) as part of checkout.
- **P2.** Pay $30 for the first year — this covers both the domain registration and the Starter Static Hosting plan. Know the ongoing cost going in: it renews at **$30/year for hosting, plus the domain's normal renewal fee** (~$10–15/year for `.com`) from year two onward — meaningfully more than the Netlify path (~$10–15/year total, since Netlify's hosting is free).
- **P3.** In the Porkbun hosting dashboard, connect the same GitHub repo from Phase 4/D1 (Static Hosting supports GitHub Connect for auto-deploy on every push), or upload `index.html` directly through FTP/the file manager if you'd rather skip GitHub entirely.
- **P4.** Because the domain and hosting are both with Porkbun, there's no separate DNS-pointing step — they're already connected. Free SSL is issued automatically, same as Netlify.
- **P5.** Continue to Phase 6 below to test and launch — identical either way.

**Why you might pick this over Netlify:** one login, one bill, one support line — genuinely simpler for ongoing upkeep, especially if Henry ever wants to manage this himself. **Why you might not:** roughly $30/year more than the Netlify path, for no functional difference — this site is well within both platforms' free/starter limits regardless.

## Phase 5.5 — Set up email (required, not optional)

The site already links to `henry@mathwithhenry.com` in the Contact section, so this has to exist before launch — it's not a nice-to-have. Neither Netlify nor Porkbun's Static Hosting includes an inbox; whichever hosting path you took above, email is always a separate piece.

- **E1.** Pick a provider: **Zoho Mail** (free tier, custom-domain inbox) or **Google Workspace** (~$6/month, full Gmail interface). If you went the Porkbun bundle route, check Porkbun's own **Email Hosting** or **free Email Forwarding** first — keeping it under the same account may be simpler than adding a third vendor.
- **E2.** Sign up and follow the provider's domain-verification flow — they'll hand you DNS records to add, typically an MX record (routes mail) and a TXT record (proves you own the domain).
- **E3.** Add those records wherever the domain's DNS actually lives: Netlify's DNS panel if you pointed nameservers there in Phase 5, your registrar's DNS panel if you kept DNS separate, or the Porkbun dashboard if you used the bundle. These records don't conflict with the site's existing A/CNAME records — different record types, different jobs.
- **E4.** Wait for DNS to propagate (same 1–48 hour window as Phase 5), then send yourself a test email to confirm it actually arrives before considering this done.

## Phase 6 — Test and launch

16. On a phone and a laptop, check: every nav link scrolls correctly, the "Text," voicemail, and email links open the right app, and the Cal.com link opens the real booking page.
17. Run the live URL through Google's PageSpeed Insights or Lighthouse (built into Chrome DevTools) as a quick sanity check.
18. Once satisfied, share the domain: update the business card, any social profiles, and email signature with the new URL.

## Optional polish (not required to launch)

- **Analytics:** add a lightweight, privacy-friendly tracker like Plausible, or Google Analytics if preferred — one script tag in `index.html`.
- **Local visibility:** create a free Google Business Profile listing for search/maps presence.
- **Ongoing:** domain renews annually (set a calendar reminder); revisit testimonials and availability periodically.
