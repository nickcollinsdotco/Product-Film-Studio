# 10: Share a tab: grab one screen, or stitch the whole page as it's scrolled

**Type:** task
**Status:** done (tested locally; a live stitch of nickcollins.co rendered and inspected 2026-10-18). Waiting on Nick to try it on his own tabs.
**Blocked by:** —

**Source:** React Bits Center Stage's capture (idea only: its licence bars a hosted copy; `tools/quick-loop/stitch.js` is our own).

Quick Loop's **Share a tab…** shows the tab live on the stage. **Grab this screen** keeps one view. **Full page** stitches the page while it's scrolled from top to bottom, then **Done**. It works on anything the browser can show, logged-in apps included, which headless capture can't reach.

## How the stitch works

- Frames are compared as row signatures: luma averaged over 48 column bands, with every row kept, so shifts are exact to the pixel. Only cells with detail count, judged with their step to the row below.
- The shift is the one most cells agree on, weighted by the share that agree. It's trusted when 45% agree, or when it clearly beats every other shift (3×, or 1.5× if it carries on the last scroll). That lets parallax and sticky headings through.
- **Fixed overlays:** cells that stay put through two moves while the page moves on. Two kinds count: solid bars cut at their own edge, and partial overlays (docks, chat buttons). Band edges are held for 6 moves, and a top band with an edge that's seen 3 times is the header, kept to the end. This handles translucent headers.
- **Writing:** keyframes about half a band apart, each joined to the last at the best-agreeing row in the top 40% of their overlap. Reveals have settled by then, and animations get one seam per half-screen rather than a strip per frame.
- **Capture size:** twice the tab's CSS size, asked as a minimum once the frames settle. Chrome re-renders the tab at that density. It gave 1.5× here (1,920 px from a 1,280 px tab).
- **Wheel hint:** where Chrome allows it, a wheel over the live view scrolls the tab (captured-surface control). The wheel distance narrows the search and places frames across blank stretches.

## Checked

- 6 unit tests on a synthetic page: a fixed header, footer, scrollbar, scroll back up, a lost jump that is then found again, a blank stretch crossed on the wheel, a floating dock, content fading in, an animated block, and a dark page.
- Live: nickcollins.co, shared and scrolled at about 1,200 px a second in headless Chrome. Result: a 1,920 × 14,772 page with every section in order, no header copies and no duplicated sticky headings. Rendered as a Glide Loop, 1,920 × 1,080 at 60 fps; the frames are sharp.

## Known limits

- **Scroll-linked zoom or parallax inside an element** (nickcollins.co's photo strip) leaves a stair-step seam where keyframes join.
- **A blank stretch taller than the view**, scrolled without a forwarded wheel, loses the place; the HUD says to scroll back up.
- Scrolling very fast loses the place the same way.
- The bottom of the last view is only kept above any fixed bar there.
- Chrome or Edge only: it needs `MediaStreamTrackProcessor`.

## Comments

- 2026-10-18: The automated runs can't exercise captured-surface control: its permission prompt is denied in headless Chrome. So wheel forwarding is untested.
