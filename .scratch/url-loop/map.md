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

## Borrow and steal (planned as issues)

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

- 2026-10-13: Finish the v1 Library first, then try option B. Not an editor, not a component registry.
- 2026-10-14: Keep the browser frame (no chrome-free option until someone asks). snapcn editor timing is optional, deferred behind 01.

## Fog

- Browser chrome in frame: keep the browser frame (recommended) or offer snapcn-style cropped, chrome-free framing as well?
- Form: a hosted web app, a local tool or a CLI? Hosting means capture and rendering on a server (headless Chrome, HyperFrames, FFmpeg) and real running costs.
- Whether to publish a Remotion `scroll-capture` component into snapcn's ecosystem (option C) as a cheap distribution probe. It splits the stack; revisit only if the X probe shows pull from Remotion users.
