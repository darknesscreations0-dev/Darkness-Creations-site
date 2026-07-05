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

## Notes

- All animation libraries (GSAP, ScrollTrigger, Lenis) are loaded via CDN — no npm/build step needed.
- Fonts: Clash Display (display) via Fontshare, Inter (body) via Google Fonts — both CDN-linked.
- Reduced-motion is respected throughout (`prefers-reduced-motion`).
- Currently built: **Home page** only. Crispy Pizza page, marketplace, and product page templates are the next milestones per your brief.
