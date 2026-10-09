# Where Focus areas are stored and how they're written

Type: grilling
Status: open
Blocked by: 06

Probably Screen metadata in the ingest manifest (content, ADR-0003). Written by Claude proposing them from the image, or from DOM boxes in a Capture (ADR-0006); the user approves. `whole` is built in.

Done when: decided and recorded.

## Research (draft, 2026-10-09; nothing decided)

### Claude proposing Focus areas from the image

Tried for real in the look test (02).

- **How it went.** Claude read a 1512×982 downscale of the 3x hero Screen. It proposed `title`, `rail`, `nav` and `hero-image` as 1x px boxes, estimated by eye, plus a one-line reason for each. You picked `title → rail` in one question.
- **Accuracy.** Using only the box centres, the camera framed both areas correctly on the first render. Precision by eye is roughly ±10–20 px at 1x: fine for camera targets and focus, too loose for tight crops or masks.
- **Names.** They come from what's visible (`title`, `rail`, `nav`). Claude can also say why an area is worth a Shot.
- **Tall pages.** Images are downscaled before Claude sees them, so the 4536×14388 full page would be seen coarsely. Proposing areas there would need the page read in tiles (crop windows), which costs more reads, and the boxes would then need checking.
- **Any Screen works**, DOM or not: Figma exports, app screenshots, a client's PNG.
- **Approval** already exists: a snapshot framed on each area, shown as a contact sheet.

### What a DOM capture gives

Source: HyperFrames 0.8.141 `capture`, read from the source, not run (`packages/cli/src/capture/types.ts`, `tokenExtractor.ts`).

- **`sections[]`**: selector, type, x/y/width/height in page CSS px, heading text, CTA labels, a layout hint and up to 600 chars of text. Only page-level blocks qualify: at least 400×200, not over 80% of the page, and with a heading. The candidates come from `section`, `main > div`, `article`, `[class*=hero]`, `[class*=container]` and similar selectors.
- **`headings[]`** carry text and styles but no boxes. There are no element-level boxes for components such as a card rail, a CTA row or the nav.
- **Screenshots.** The default viewport is 1920×1080, and the full-page plate is a plain `fullPage` screenshot with no raised device scale factor. That's 1x, below the 3x Screen bar (ADR-0006 is still `proposed` on exactly this point).
- **Coordinates don't transfer.** Boxes only map onto a Screen taken at the same layout width. The VR Screen is 1512 wide, the capture default 1920, so the layout reflows and the boxes don't line up.
- **What a DOM gives that an image can't**: exact boxes for any element we can name a selector for, at any DPR, and stable across re-captures if the markup doesn't change. Getting component-level areas would mean our own capture step: Playwright at the Screen's width and DPR 3, querying chosen selectors.
- **Only live URLs or local builds have a DOM.** Static Screens don't.

### Questions for you (decisions)

1. Are your Screens usually from a site you can run (so a DOM is available), or mostly static exports (Figma, screenshots)? That decides whether DOM boxes are primary or a bonus.
2. Are Focus areas only camera targets (centre and rough extent), or will they also drive tight crops, masks or highlights that need exact boxes?
3. Where do they live: a sidecar next to each Screen (`<screen>.areas.json`), or entries in the ingest manifest (ADR-0003)?
4. Which coordinates: 1x CSS px at the Screen's layout width (what the look test used), or normalised 0–1?
5. How do you approve them: a contact sheet of framed snapshots, one per area, or boxes drawn on the Screen?
6. If DOM boxes are wanted, our own small capture step (exact width, DPR 3, named selectors) rather than `hyperframes capture`?

