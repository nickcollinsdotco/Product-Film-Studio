---
status: accepted
---

# Live URLs are captured and frozen, never embedded live

A running product is captured once into local assets (a Capture) and then treated like Screens and Recordings. It is never embedded live in a Film. A live page would make renders depend on the network and on the site's current state, which breaks deterministic, repeatable rendering.

Proposed until we verify what `hyperframes capture` actually produces (resolution, stills versus scroll video) and whether it meets the Screen quality bar. *Accepted (2026-10-11, [ADR-0012](0012-v1-is-light-css-loops.md)):* v1 captures with Quick Loop's own full-page capture (headless Chrome, cookie banners hidden), not `hyperframes capture`.
