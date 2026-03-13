# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev       # Start dev server at localhost:4321
npm run build     # Build to ./dist/
npm run preview   # Preview production build locally
```

No test suite or linter is configured.

## Architecture

This is a personal website built with **Astro 6** using the **Starlight** documentation theme (`@astrojs/starlight`).

The site has two distinct areas:

1. **Home page** (`src/pages/index.astro`) — A custom landing page outside Starlight, using `src/layouts/Layout.astro` and `src/components/Home.astro`. The home page features a hero section with a background image and a bouncing construction truck animation (inline script in `Home.astro`).

2. **Learning notes** (`/learning/...`) — Starlight-powered docs site. Content lives in `src/content/docs/learning/` as Markdown files. The sidebar in `astro.config.mjs` auto-generates from subdirectories: `linear-algebra`, `probability`, `machine-learning`.

### Content

- Add new note categories by creating a subdirectory under `src/content/docs/learning/` and adding a corresponding `autogenerate` entry in `astro.config.mjs`'s `sidebar` array.
- Math rendering is supported via `remark-math` + `rehype-katex` (use `$...$` for inline, `$$...$$` for display math).
- KaTeX CSS is imported in `src/styles/starlight-custom.css`.

### Styling

`src/styles/starlight-custom.css` overrides Starlight's default theme with a custom Claude-inspired dark theme (warm neutrals, accent `#c98a63`). All Starlight CSS variable overrides are in the `:root` block at the top of that file.
