## Purpose
Help AI coding agents become immediately productive in the Arcade-100 repository (vanilla HTML/CSS/JS games).

## Quick Summary
- This is a static, zero-build project: each game lives in its own folder and exposes an `index.html` entrypoint (e.g. `snake/index.html`, `2048/index.html`).
- The main hub is `index.html` at the repo root which links to individual game folders and contains a simple progress UI.
- No `package.json`, bundlers, or CI manifests were detected — serve statically to test locally.

## Quick Start (what an agent can run locally)
- Serve the repo root with any static server, e.g.: `python -m http.server 8000` or `npx serve .` and open `http://localhost:8000/`.
- Open game pages directly (e.g. `/snake/index.html`).

## Project structure & important files
- Root: `index.html` — the game hub and progress tracker. Update this when adding or linking games.
- `README.MD` — high-level roadmap and completed checklist for games.
- Game folders: one folder per game containing `index.html`, plus any JS/CSS/assets local to that game (e.g. `space-shooter/index.html`).

## Key patterns & conventions (use these when editing or adding content)
- Vanilla-only: code assumes no build tools or frameworks. Keep changes compatible with plain browser loading.
- Entrypoints: every playable game must include an `index.html` at the game folder root.
- Hub linkage: to add or expose a game in the hub, add a card anchor linking `./<game-folder>/index.html` inside the root `index.html` game grid.
- Progress bookkeeping: the hub shows a `progress-fill` inline style (`width: X%`) and the README checklist. If marking a game completed update both `index.html` (progress width / completed count) and `README.MD` checklist entries.

## Examples from this repo
- Existing hub cards link like `./snake/index.html` and `./pac-man/index.html` in `index.html`.
- Progress indicator example: `<div class="progress-fill" style="width: 6%"></div>` — 6 completed games correspond to `6%`.

## How to add a new game (minimal steps)
1. Create folder `my-game/` and add `my-game/index.html` + assets.
2. Add a game-card anchor to root `index.html` linking `./my-game/index.html` (follow the existing card markup and badges).
3. If already playable, mark the card with `.badge-completed` and update `progress-fill` width and `README.MD` checklist.

## Searching & debugging tips for agents
- Global search term to find entrypoints: `href="./` (many hub links follow this pattern).
- Look for per-game logic inside the same folder as `index.html` (JS files are usually co-located, not modularized).
- If a game behaves differently in local filesystem vs server, recommend using a static server (some games rely on fetch/XHR or proper MIME types).

## What NOT to assume
- There is no centralized build/test harness — do not add or rely on a `node_modules`/bundler workflow without first proposing it.
- No automated CI or test runners were found; automated tests are not part of this repo's discovered patterns.

## Useful heuristics for PRs and edits
- Small, focused changes per game folder are preferred. Avoid sweeping refactors across many games (each is an independent demo).
- When modifying the hub (`index.html`) only change or add a single card per PR and update the README progress numbers consistently.

## Questions for the maintainer (ask before large changes)
- Do you want a standard static dev server added (e.g., a simple `package.json` with `serve`) or keep zero-dependency workflows?
- Preferred naming convention for new games (lowercase with hyphens is common in the repo).

---
If anything here is unclear or you want more examples (component conventions, commonly used utility functions, or a recommended dev server), tell me which area to expand and I will iterate.
