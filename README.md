# Darkness Creations — Website

Static site, built to run directly on **GitHub Pages** (no build step, no server).

## Structure

```
darkness-creations/
├── index.html                  ← Home page (Darkness Creations)
├── marketplace.html            ← Full marketplace: project files, presets, plugins, courses
├── assets/
│   ├── css/
│   │   ├── tokens.css          ← Shared design tokens + shared login modal styles
│   │   ├── home.css
│   │   └── marketplace.css
│   └── js/
│       ├── auth.js             ← Shared fake-login system (see note below)
│       ├── main.js
│       └── marketplace.js
└── brands/
    └── crispy-pizza/           ← Separate site section, own orange/black identity
        ├── index.html
        └── assets/
            ├── css/crispy-pizza.css
            └── js/crispy-pizza.js
```

## Shared login (important — read this)

`assets/js/auth.js` gives you a **fake, front-end-only login** so that logging in on
the Darkness Creations home page also shows you as logged in on Crispy Pizza and the
Marketplace. It works because all pages share the same origin on GitHub Pages, and it
stores your name + a coin balance in the browser's `localStorage`.

**This is not real authentication.** There's no password, no server, no database —
anyone can type any name. It's meant to let you demo the "one account across the
whole site" experience before you wire up real auth. When you're ready to launch for
real, swap `auth.js` for a real provider (Supabase Auth, Firebase Auth, Clerk, or your
own backend) — the rest of the site only calls `DCAuth.getUser()`, `DCAuth.login()`,
`DCAuth.logout()` and `DCAuth.openModal()`, so the swap is contained to that one file.

## Crispy Pizza

Separate brand section at `brands/crispy-pizza/`, styled independently (orange/black,
gaming-inspired) from the violet/black Darkness Creations look. It has its own product
shelf and is not connected to the Darkness Creations marketplace — per your call, each
has its own store.

## Adding a new brand/venture

1. Duplicate `brands/crispy-pizza/` as a template, or create `brands/<new-brand>/index.html`.
2. Always link `../../assets/css/tokens.css` first, then a brand-specific stylesheet that overrides only what that brand needs (its own accent colors, etc.).
3. Add a card for it inside `#ventures` on `index.html`, and a link in the footer's "Ventures" column.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo settings → Pages → set the source to the `main` branch, root folder.
3. All asset paths are relative, so this also works if the repo is served from a subpath (e.g. `username.github.io/darkness-creations/`).

## Admin panel (real backend via Supabase)

`admin.html` is a password-protected dashboard for adding, editing and deleting
products — for both the Darkness Creations marketplace and the Crispy Pizza store —
including image and video uploads. It's backed by **Supabase** (free tier), a real
database + file storage service, so products you add show up live for every visitor,
not just you.

### One-time setup

1. Create a free project at **supabase.com**.
2. In your project: **SQL Editor → New query** → paste the entire contents of
   `assets/sql/supabase-setup.sql` → **Run**. This creates the products table,
   security rules, and the storage bucket for images/videos/files.
3. **Authentication → Users → Add user** → create one login (your email + a password).
   This is the only account that can access `admin.html`.
4. **Project Settings → API** → copy your **Project URL** and **anon public key**.
5. Open `assets/js/supabase-config.js` and paste those two values in where indicated.
6. Re-upload the site (or just that one file) to GitHub.

### Using it

- Go to `yoursite.com/admin.html`, log in with the account from step 3.
- Switch between the "Darkness Creations Marketplace" and "Crispy Pizza Store" tabs
  at the top — products are kept separate per your earlier call.
- Add a product: name, category, price (or mark it free), description, tags, and
  optionally an image, a preview video, and the actual downloadable file. Hit
  **Add product** — it appears on the live marketplace page immediately.
- Click **Edit** or **Delete** on any existing product in the list on the right.

### What's still missing before a real launch

- **Payments.** "Buy now" currently just links to the uploaded file directly — there's
  no checkout, so right now anyone with the link can download a paid file for free.
  Before selling anything for real, wire this to Stripe or a similar processor so the
  file link is only revealed after payment.
- **`admin.html` isn't hidden from search engines by more than a `noindex` tag** — the
  page itself is reachable by anyone who finds the URL, but they can't do anything
  without your login. Still, don't link to it publicly.



- All animation libraries (GSAP, ScrollTrigger, Lenis) are loaded via CDN — no npm/build step needed.
- Fonts: Clash Display (display) via Fontshare, Inter (body) via Google Fonts — both CDN-linked.
- Reduced-motion is respected throughout (`prefers-reduced-motion`).
- Currently built: **Home page** only. Crispy Pizza page, marketplace, and product page templates are the next milestones per your brief.
