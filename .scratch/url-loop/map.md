# URL Loop: a URL in, a premium scroll Loop out

**Status:** active since 2026-10-14 (v1 Library called done). Issue 01 in progress.

Option B from the snapcn review on 2026-10-13. Quick Loop becomes a small public tool: paste a URL, get a seamless, size-budgeted scroll Loop for portfolio cards, Framer and X. No editor. It is built from the v1 Library's Scroll Shot, Focus moves, Device frames and Backdrops, not as a second system.

**Pitch:** "Your site, as a looping card video, in 30 seconds. No editor."

**Feature cap:** one Scroll Shot, one Focus zoom, browser and phone frames, three Backdrops (brand colour, void, Backlight), three Frame sizes (Landscape, Story, Square). Anything beyond that needs a real user asking for it.

**First step when un-parked:** issue 01, the X probe. Build nothing public before it shows pull.

## Notes: snapcn (snapcn.dev), reviewed 2026-10-13

The closest competitor at launch: a shadcn-style registry of Remotion components by Shadcn Labs.

- **What it is:** 46 free MIT components and 52 Pro (said to grow to 500+), copied into the user's repo with `npx shadcn@latest add @snapcn/<name>`, with no runtime dependency. Categories: Text & Titles, Captions, Logos, Screens & Devices, Charts & Stats (Pro only), Social Proof, Scenes and AI Chat Input. Also an agent skill (`npx skills add snapcndev/snapcn`), an MCP server (Pro), and about 10 templates due 20 October (Pro): Product launch, Feature announcement, Changelog, Demo Day pitch, Pricing explainer.
- **Editor:** in the browser. You add components to a timeline and edit their text, images and length, with an audio track. The cap is 180s, the canvas 1280×720. Free exports are 720p with a snapcn mark; Pro gets 1080p with no mark. Next on its roadmap: exporting the timeline as Remotion code.
- **Pricing (Spain, before tax):** Free €0; Pro about €115/yr; Lifetime about €222 once; Commercial (client work, 5 seats) about €446 once. No refunds. The 20 October early-bird price is locked in for renewals.
- **Audience and shape:** developers making **story** launch videos: Hook → Positioning → Product reveal → Features → Proof → CTA, about 18–45s, heavy on kinetic type, fake AI chat UIs and logo stings. Canvas 1280×720 at 30fps.
- **The gap we aim at:** no URL capture, no scrolling page Shot, no Loops or Seams, no auto zoom. None of these is shipped, being built, next or under exploration on its roadmap (checked 2026-10-13). `screen-recording` is the closest: one image or video with a keyframed push-in and pull-out.
- **Recheck before un-parking:** `/docs/roadmap`, `/docs/changelog`, `/docs/templates` and `https://snapcn.dev/llms.txt` for any URL, scroll or loop feature. If one appears, re-decide whether B is still worth it.

### Their quality bar (`skills/snapcn/references/anatomy.md`)

Mostly agrees with Steel Hat. Worth reading in full before writing our anti-patterns (issue 04):

- One accent colour per video, used only on the word that matters, the active number and the CTA.
- The product is the hero: big and legible. Never near-black, low-contrast or a distant floating window.
- No large glows or halos behind headings ("the #1 tell"), no saturated full-frame gradients, no gradient text, no ALL-CAPS blocks.
- No feature-list or catalogue dumps, no lorem, no repeating the same screenshot under different labels.
- "The camera push is how a screen shot points at something": push to a focal point and back out. Because the push moves with the footage, it can't drift off its target the way an overlay can.
- **Disagreement:** "no browser or OS chrome in frame", so they crop it off. We keep a browser frame because it says "website" at card size. Open question in Fog.

## Notes: React Bits Center Stage (reactbits.dev/tools/center-stage), reviewed 2026-10-18

A free in-browser tool by David Haz: a screenshot, recording or shared tab, placed on 3D devices with tilt, depth of field, shadows and type. Exports 4K PNG, 4K60 MP4/WebM and GIF, plus a share link. Nick: "works really well".

- **Licence: MIT + Commons Clause.** It bars offering the tools "or a substantially similar copy of them as a hosted service", ported versions included. A public URL Loop is exactly that, so **ideas only, no code** (stricter than snapcn's MIT). Nothing of theirs was copied; what we built is our own code.
- **How it works:** all in the browser. A WebGL renderer drives the preview and the export alike; WebCodecs (mediabunny) encodes, gifenc does GIFs; no server. Capture uses `getDisplayMedia` on a tab, with Chrome's captured-surface control so a wheel over the live view scrolls the tab; an optional script on the user's own site drives the scroll and hides sticky bars; a worker stitches frames into a full page by matching pixels.
- **Loops:** every motion is a periodic function of phase, so loops are seamless by construction; their scroll goes down and back, like our Bookend.
- **Breadth:** about 60 presets (Galleries, Reveals, Devices, Isometric...) in groups, each showing 3 "hero" controls first.
- **Competition:** it closes much of the gap we listed against snapcn (URL capture, scrolling page, loops). What we still have that it doesn't: a one-step URL capture with no share dance, a zoom to a chosen Focus area with a scroll limit, the Build intro, a checked Seam, cookie banners hidden, a site's light or dark theme.

### Borrowed (issues 10-13, built 2026-10-18)

| # | Item | Kind |
|---|---|---|
| 10 | Share a tab: grab one screen, or stitch the full page as it's scrolled | borrow idea, our own stitcher |
| 11 | Presets that show only their 3 hero controls, with tiles that play the preset on your image | borrow |
| 12 | Share link: the settings and image in the URL's hash | borrow |
| 13 | Size hints, and a warning when the image is softer than the Loop shows it | borrow |

### Avoid

- The 3D device engine and its breadth (galleries, isometric, carousels): the same breadth trap as snapcn's.
- Type behind the device (Loops are untitled, ADR-0010); grain on by default.
- In-browser encoding for now: it conflicts with ADR-0001. Keep it as evidence for the hosting question in Fog (no server render costs) if URL Loop goes public.

## Borrow and steal from snapcn (planned as issues)

| # | Item | Kind | From |
|---|---|---|---|
| 01 | X probe: 3 Loops, captioned with how long each took | validation | our idea, prompted by their launch |
| 02 | Camera move semantics: carry-over values and focal-point clamping | borrow + steal maths (MIT) | `screen-recording` |
| 03 | A natural length for each Shot template | borrow | snapcn catalogue's `Length` column |
| 04 | Anti-patterns file for agents | borrow | `anti-patterns.md`, `anatomy.md` |
| 05 | Easing vocabulary: their named cubic-beziers | steal values (MIT) | `capture-reveal` |
| 06 | Cursor waypoints with a click ring | borrow, much later | `cursor-track` |
| 07 | Public gallery, plus free-with-mark / paid-without pricing | borrow, only if public | their site and pricing |
| 08 | Time-to-first-export benchmark against their editor | inspect | `/docs/video-editor` |

**Stealing rules:** only free MIT components, and keep their copyright notice in any file the code lands in. Never Pro code. Their code is React/Remotion, so "steal" means porting the maths and values to our GSAP/HyperFrames Library, not adopting the files.

## Avoid (and why)

- **An editor or timeline UI.** It's their whole investment and we can't out-build it; Shots are composed, not edited (GLOSSARY).
- **Breadth:** text animators, captions, AI-chat sims, charts, logo stings, social proof, a template catalogue. Their moat is 100+ components and a new clip a day.
- **Switching to Remotion.** ADR-0001 stands; nothing in snapcn is a reason to move.
- **Story-beat structure (Hook → CTA) for Loops.** Loops are untitled and silent (ADR-0010). It belongs, if anywhere, in full Films.
- **Their canvas, 1280×720 at 30fps.** We export at 1600 px and 60fps (ADR-0012, v1-library 08).
- **A Pro tier or subscription before anyone asks to pay.**
- **Pre-made fake product UIs.** We film real Screens; that's the point.

## Decisions so far

- 2026-10-18: Nick: implement the Center Stage borrows (tab share, hero-control presets, share link, size hints). Built as issues 10-13; ideas only, no code (its licence bars a hosted copy).

- 2026-10-13: Finish the v1 Library first, then try option B. Not an editor, not a component registry.
- 2026-10-14: Keep the browser frame (no chrome-free option until someone asks). snapcn editor timing is optional, deferred behind 01.

## Fog

- Browser chrome in frame: keep the browser frame (recommended) or offer snapcn-style cropped, chrome-free framing as well?
- Form: a hosted web app, a local tool or a CLI? Hosting means capture and rendering on a server (headless Chrome, HyperFrames, FFmpeg) and real running costs.
- Whether to publish a Remotion `scroll-capture` component into snapcn's ecosystem (option C) as a cheap distribution probe. It splits the stack; revisit only if the X probe shows pull from Remotion users.
- In-browser encoding (Center Stage's route) would remove server render costs if URL Loop is hosted, but it means leaving ADR-0001's renderer for exports. Only worth it if B goes public.
- Live animations in a Capture (issue 09): the frame-stepped clock shim works on nickcollins.co. Still unknown: how it combines with scrolling, the loop seam, and picking the region. Deferred behind 01.
