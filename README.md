# Darkness Creations — Website

Static site, built to run directly on **GitHub Pages** (no build step, no server).

## Structure

```
darkness-creations/
├── index.html                  ← Home page (Darkness Creations)
├── marketplace.html            ← Full marketplace: project files, presets, plugins, courses
├── assets/
│   ├── css/
│   │   ├── tokens.css          ← Shared design tokens (colors, type, spacing) — used by every page/brand
│   │   ├── home.css            ← Styles scoped to the Home page
│   │   └── marketplace.css     ← Styles scoped to the Marketplace page
│   └── js/
│       ├── main.js             ← Lenis smooth scroll, GSAP reveals, cursor glow, pipeline scrub
│       └── marketplace.js      ← Category filters, search, wishlist toggle, cart counter (front-end only)
└── brands/
    └── crispy-pizza/           ← Each new brand gets its own folder here (next milestone)
        ├── index.html
        └── crispy-pizza.css
```

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
