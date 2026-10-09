# Do the portfolio's Framer cards lazy-load video?

Type: research
Status: resolved

A page shows several Loops, so the 6 MB cap assumes off-screen cards don't load. Needs the portfolio URL; check the network tab while scrolling.

Done when: answered here. If they don't lazy-load, raise it against the cap in 06.

## Answer

**Yes, they lazy-load.** Checked 2026-10-09 on `https://www.nickcollins.co/` (Framer), home page, 1536×960 viewport, by polling each `<video>`'s `preload`, `readyState`, `buffered` and `paused` while scrolling.

- The served HTML has `preload="none"` on both card videos, and on load neither fetches anything (`readyState` 0, nothing buffered).
- A video starts loading just before it enters the viewport: the second card switched to `preload="metadata"` and had 8 of 14.9s buffered while its top was still about 40px below the fold. In view it switches to `preload="auto"`, buffers fully and plays.
- Off-screen it pauses, but stays buffered. So the page's total weight grows with how far a visitor scrolls; only the first screen's cards cost anything on load.
- Two card videos today: 3.93 MB (4s; byte-identical in size to `references/ultramock/control-free-03.mp4`) and 2.05 MB (14.9s).

The 6 MB per-Loop cap stands: no need to raise it in 06. Only the home page was checked.
