# Where Focus areas are stored and how they're written

Type: grilling
Status: resolved

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

## Comments

**2026-10-09, user's answers to the research questions.**

1. Screens come from a site the user can run, or from Figma, about 60/40.
2. Focus areas are rough camera targets for now.
3. Storage: undecided; wants suggestions or a discussion.
4. Coordinates: undecided; wants suggestions or a discussion.
5. Approval: boxes drawn on the Screen are easiest for the user; open to other suggestions.
6. Own capture step versus `hyperframes capture`: undecided; wants suggestions or a discussion.

**Claude's suggestions (not decided; for the grilling).**

- **Q3, storage:** a sidecar next to each Screen, `<screen>.areas.json`. Areas belong to the Screen (glossary), so they should travel with the file whether it came from a site or from Figma. The ingest manifest (ADR-0003) can point to the sidecar instead of copying its contents.
- **Q4, coordinates:** 1x px at the Screen's layout width, with that width stored in the file (for example `"layoutWidth": 1512`). This is what the look test used. It reads naturally against the site and against Figma frames, both 1x px, and it holds for @2x and @3x exports. Normalised 0–1 values are harder to read and to sanity-check.
- **Q5, approval:** Claude writes a single overlay image, the Screen with each area's labelled box drawn on it (drawn with PIL, because FFmpeg's `drawtext` crashes here). You approve or correct it in one reply. Framed snapshots then wait for the Draft render, where they come free. A small drag-to-adjust HTML page is possible later, only if correcting boxes in words becomes tedious.
- **Q6, capture:** neither for now. Rough camera targets don't need DOM precision, and Claude proposing from the image works for both sources (tried in 02). Revisit when an area needs tight boxes. At that point two exact sources exist: the DOM, through our own Playwright step at the Screen's width and DPR 3 (`hyperframes capture` runs at 1920 wide and 1x), and Figma layer bounds through the Figma connector (not yet authorized).

## Answer

Decided by the user on 2026-10-09: all four of Claude's suggestions above are accepted. The original block on 06 is dropped, because these answers hold whether 06 says build or buy; if buy, they apply to the full-Film layer.

- **Storage:** a sidecar next to each Screen, `<screen>.areas.json`. The ingest manifest points to it rather than copying it.
- **Coordinates:** 1x px boxes at the Screen's layout width, with `layoutWidth` stored in the file.
- **Who writes them:** Claude proposes areas from the image. For now they're rough camera targets, for both site and Figma Screens (about 60/40). `whole` is built in.
- **Approval:** one overlay image of the Screen with labelled boxes (drawn with PIL). The user approves or corrects it in a reply.
- **Capture:** no capture step for now. When exact boxes are needed, the sources are our own Playwright step (the Screen's width, DPR 3) for sites and Figma layer bounds for Figma.

