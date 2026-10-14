# 01: X probe, three Loops made from URLs

**Type:** research
**Status:** claimed
**Blocked by:** —

**Question:** do people want a "URL → scroll Loop" tool, enough to justify building it?

- Make three Loops from live URLs with the Library's capture and Scroll Shot (one should be a well-known site, not a client).
- Post them on X, each captioned with how long it took from URL to MP4.
- Read the replies after a week. Pull looks like "what tool is this?", requests to make one, or follows. Likes alone aren't pull.
- Record the result under `## Answer`. No pull: B stays parked and the Library stays personal.

## Notes

- 2026-10-14: Nick called v1 done and said "you pick". Three Loops rendered through Quick Loop (1600×900, 9s, browser frame, tilt 8, returns to its opening frame), each inspected on a contact sheet:
  - `renders/quick/x-nickcollins-20261014130203-43j8.mp4`: light Backdrop, scroll down to the Steelhat Studio card, zoom in, return. 13 MB (over the portfolio's 6 MB budget; fine for X).
  - `renders/quick/x-linear-20261014131141-e70u.mp4`: opens zoomed on the agent panel in the hero, pulls out, scrolls to the logo row, returns. The first try scrolled to 0.3 and ended on a dim, empty section; 0.15 keeps it on the product.
  - `renders/quick/x-vercel-20261014130834-p2dk.mp4`: scroll from the hero to the Zapier case study, zoom in, return.
- stripe.com failed to capture: `window.UIGeneration` was undefined during the layout read, probably because the site's CSP blocked the injected script. Fixed 2026-10-14: the layout map is now optional, so such sites capture without a build intro. Raycast captured, but large parts of the page hadn't loaded, so it was dropped.
- Waiting on Nick to post them.
- 2026-10-14: capture takes a theme (Quick Loop's Theme picker, `--theme light|dark` for `library:capture`). Checked: nickcollins.co in both themes; linear.app switched to light.
