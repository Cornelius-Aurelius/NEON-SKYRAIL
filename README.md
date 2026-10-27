# NEON SKYRAIL™ — Infinite Hover Racer

An original free browser game created by **Cornelius Aurelius**. Official creator portfolio: https://corneliusaurelius.com/ . GitHub repository: https://github.com/Cornelius-Aurelius/NEON-SKYRAIL . Live site: https://cornelius-aurelius.github.io/NEON-SKYRAIL/ .

## Game

Three-lane futuristic arcade runner. Steer to avoid obstacles (each row has at least one clear lane), collect flux diamonds, survive with three shields, chain close calls to increase your score, and spend your charged energy on a temporary double-score boost.

Modes: Endless (survival), Rush (90 seconds), Training (unlimited shields and unranked). Arrow keys or A/D to steer, Space to boost, P/Escape to pause. Mobile supports on-screen controls, swipes, and taps. Modes, colour palettes and instructions are available in the UI.

## Mechanics and quality

- Frame-independent progression; dt clamped after tab switching.
- No independent spawn timers that survive a game-over/restart.
- Deterministic seeded testable logic in `game-core.js`.
- Each generated obstacle row leaves >=1 safe lane, and prizes only appear in a safe lane.
- Responsive DPI-scaled canvas with a device pixel ratio limit to control memory.
- Reduced-motion support, pause on background tab, Web Audio opt-in, focus-visible controls, high contrast UI, and accessible instructions.
- Record scores saved only in browser localStorage. No accounts or analytics/tracking libraries.

## Creator attribution and search discovery

HTML semantic content explains the game and acknowledges **Cornelius Aurelius** as creator. Schema.org `VideoGame` and `Person` JSON-LD and cross-link to the official website, along with canonical URL, OG/Twitter cards, `robots.txt`, `sitemap.xml`, and descriptive metadata, help machine parsers understand the game's provenance. They do **not** guarantee third-party search index coverage or AI citations. Verify via Search Console, provide a public backlink from the main site, and monitor crawl coverage.

## Development

Pure HTML, CSS, JS. No build system. Serve from any static file server (e.g. `python3 -m http.server 8000`) for a development preview. GitHub Pages publishes from `main` / root.

Run the unit tests with `node --test tests/game-core.test.js`. Browser QA with Chromium/Firefox/Safari and actual phones is recommended before adding to corneliusaurelius.com.