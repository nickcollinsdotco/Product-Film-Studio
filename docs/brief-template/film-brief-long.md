---
# Film brief. Sections marked (required) are the minimum; (optional) sections can be deleted or left blank.
project:          # Project this Film belongs to, e.g. "Orbital"
film:             # Working title, e.g. "Rule builder launch"
id:               # Folder slug the pipeline uses, e.g. 2026-10-orbital-rules
type: portfolio   # portfolio | client
client:           # Client name, blank for portfolio
workflow: full    # full | short (short skips storyboard and timing pass)
due:              # Date, or blank
---

# Film brief: <film>

> **Superseded (2026-10-08), kept for reference.** Use `project.md` for the Project and its Loops, and `film-brief.md` for a full Film. This long version predates Loops and still uses old vocabulary (house style, storyboard, Surface for an asset, type reveal).

**How to use.** Fill sections 1 to 6. That is enough to write a Shot list. Sections 7 to 10 are optional; anything left blank falls back to the defaults below. Guidance sits in HTML comments, so it stays out of the rendered brief and can be left in.

**Short version (8 to 10s films):** front matter, 1 (The point only), 2, 4 (2 or 3 moments), 5, 6 (End card only).

| Field | Default when blank |
|---|---|
| Theme | Dark |
| House style | On for portfolio, off for client |
| Workflow | Full: brief, Shot list, storyboard, draft, timing pass, final |
| Edits | 16:9 master (portfolio) plus 9:16 (Twitter) |
| Length | 15 to 20s, 4 to 6 Shots |
| References | Ultramock, arqe |
| Camera | Restrained: one slow move per Shot, often none |
| Music | Licensed track chosen at draft, sparse sound effects |

---

## 1. Message (required)

**The point:**
<!-- One sentence: what the viewer understands by the last frame. Write it as the viewer would say it ("Orbital lets ops teams build rules without engineers"), not as a feature list. If it needs two sentences, it is probably two Films. -->

**Audience:**
<!-- Who is watching and what they already know. Portfolio: usually hiring managers and design leads scrolling fast. Client: their customers, users or investors. This decides how much the on-screen text has to explain. -->

**Mood:**
<!-- Three words, e.g. "calm, precise, confident". Drives music, pacing and transition style. -->

**Proof (optional):**
<!-- The one piece of real UI that makes the point believable. Usually becomes the hero moment in section 4. -->

## 2. Edits (required)

| Edit | Aspect | Destination | Length | How it differs from the master |
|---|---|---|---|---|
| master | 16:9 | Portfolio | 18s | |
| vertical | 9:16 | Twitter | 15s | |

<!-- The first row is the master Edit; the Shot list is written against it. Describe other Edits only as differences: moments dropped or reordered, tighter pacing, different end card.
9:16: keep text and key UI in the central area, clear of the bottom and right edges where player controls sit.
Everything autoplays muted, so no Edit can depend on sound.
Add 4:5 or 4:3 rows when you need them. -->

## 3. Branding (required)

**House style:** on
<!-- on for portfolio films (your title and end-card typography), off for client films. -->

**Theme:** dark
<!-- Dark by default. Set light, or describe the override, if the product or client needs it. -->

**Product brand:**
<!-- If a brand kit file exists (e.g. brands/orbital.md), link it here and skip the lines below. Otherwise fill them in. Take colours and fonts from the product itself, not from memory. -->
- Logo:
- Colours:
- Fonts:
- Rules:
<!-- Rules: anything the brand forbids or insists on, e.g. "logo never on accent colour", "always sentence case". -->

## 4. Key moments (required)

| # | Moment | Surface | Text on screen | Landing |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

**Hero moment:** #

<!-- 3 to 6 beats in story order. These are not Shots: one moment may become one Shot or several, and the Shot list decides framing, camera and timing.
- Moment: what the viewer should notice, in plain words ("filter collapses 200 rows to 3").
- Surface: the screen or view of the product it happens on.
- Text on screen: the words that carry this beat with sound off. Aim for 6 words or fewer. Leave blank if the UI says it on its own.
- Landing: what hits here, if anything (type reveal, transition, UI state change, music sync). Two to four Landings per film is plenty.
Include an opening title as moment 1 if there is one. The end card belongs in section 6.
The hero moment gets the most screen time and the strongest Landing. -->

## 5. Assets (required)

| Asset | Surface | Kind | Status | Path or source | Notes |
|---|---|---|---|---|---|
| | | screenshot | have | | |
| | | recording | capture | | |
| | | logo | have | | |

<!-- Kind: screenshot | recording | logo | live URL | other. Status: have | capture | fix.
- Screenshots are the hero assets. Capture at 2x minimum, 3x for anything the camera pushes into. Use realistic, non-sensitive data. Fix copy, alignment and empty states before capture, not in post.
- Recordings only where an interaction has to be seen moving. Record with the cursor hidden; in Notes, describe the path the synthetic cursor should take and where clicks land.
- Logos as SVG, plus a mono version if the brand has one.
- Live URL: note the viewport, scroll positions and states to capture.
Anything marked capture or fix blocks the storyboard, not the Shot list. -->

## 6. Ending (required)

**End card:**
<!-- What sits on the final frame: logo lockup, product name, tagline. House style typography for portfolio films, Product brand for client films. -->

**Call to action:**
<!-- The one next step and where it lives: URL, handle, "Available now". Portfolio films may have none; write "none" so it reads as a decision, not a gap. -->

**Per-Edit differences:**
<!-- e.g. vertical shows the handle, master shows the URL. Leave blank if identical. -->

**Hold:**
<!-- Default about 2s. Long enough to read the CTA twice. -->

---

## 7. Music and sound (optional)

**Track:**
<!-- Title, artist, source, licence reference, file path. Or "pick at draft". -->

**Tempo and feel:**
<!-- BPM if known, or a description: "slow build, one lift around 0:08". -->

**Sync points:**
<!-- Which Landings should hit on the music. Usually the hero moment and the end card. -->

**Sound effects:**
<!-- Palette and restraint, e.g. "soft UI ticks on clicks, one swell into the end card". Sound adds weight; it never carries meaning, because every Landing must read muted. -->

## 8. Look and references (optional)

**References:**
<!-- Ultramock and arqe are the defaults. Add film-specific references with one line on what to take from each ("arqe: slow parallax on stacked cards"). A reference without a reason gets ignored. -->

**Camera:**
<!-- Only if it differs from the default. e.g. "locked off throughout, motion comes from the UI". -->

**Transitions:**
<!-- Preferred style, e.g. "match cuts on shared UI elements, masked wipes into type". -->

**Avoid:**
<!-- What would cheapen this film, e.g. "no device spins", "no glow on the accent colour". -->

## 9. Constraints (optional)

**Must show:**
<!-- Features, claims or partner logos the film cannot leave out. -->

**Must not show:**
<!-- Unreleased features, real customer data, competitor names, anything under NDA. -->

**Approvals:**
<!-- Who signs off and at which stages. Client films often need sign-off on the Shot list and the final. -->

## 10. Notes for the Shot list (optional)

<!-- Open questions, half-formed ideas, things you are unsure about. Whoever writes the Shot list should resolve or raise these, not skip them. -->
