---
project:          # e.g. "TLDR"
type: portfolio   # portfolio | client
client:           # blank for portfolio
live_url:         # if the product is coded and capturable
---

# Project: <name>

**How to use.** Fill this once per Project. Every clip and film for the Project inherits from it, so a clip card only says what is specific to that clip. Add clips as cards at the bottom. A full film gets its own brief (`film-brief.md`) that points back here.

Values already filled in are the defaults. Change only what differs.

---

## 1. Product (required)

**One line:**
<!-- What it is and who it is for, in plain words. "A dashboard that turns live streams into short clips for streamers." Every clip should make this a little more believable. -->

**Audience:**
<!-- Who watches. Portfolio: hiring managers and design leads, scrolling fast, no sound. Client: whoever the client is selling to. -->

## 2. Brand (required)

**House style:** on
<!-- on for portfolio (your title and end-card type), off for client work. Clips rarely show it; it matters for full films. -->

**Theme:** dark

**Product brand:**
<!-- Link a brand kit (e.g. brands/tldr.md) and skip the lines below, or fill them in from the product itself. -->
- Logo:
- Colours:
- Fonts:
- Rules:

## 3. Look (optional)

| Setting | Default | This Project |
|---|---|---|
| Frame | Bare plane (no device) | |
| Scene | Dark void, soft glow in the brand accent | |
| Focus | Shallow, slow rack between focus areas | |
| Camera | One slow move per angle | |
| Text | None: the product's own type does the talking | |
| Sound | Silent clips; music only for full films | |
| Edits | 16:9 and 9:16 | |
| Avoid | Device spins, fast whips, fake UI | |

<!-- Frame: bare plane | browser | laptop | monitor | phone | tablet.
Scene: void | brand glow | studio light (pale grey gradient, as in the Vercel reference) | environment.
Only fill the right-hand column where this Project breaks a default, e.g. a light product shot in studio light. -->

## 4. Surfaces (required)

| Surface | Asset | Kind | Status | Notes |
|---|---|---|---|---|
| | | screenshot | have | |
| | | recording | capture | |
| Logo | | svg | have | |

<!-- One row per screen or view worth filming. This is the shared asset list every clip and film draws from.
Kind: screenshot | recording | live URL | svg. Status: have | capture | fix.
- Screenshots: full page or full view at 3x. Clips crop hard (a close-up may use a fifth of the frame), so resolution is what makes them look expensive.
- Pick and stage the data before capturing: realistic names, satisfying numbers, no empty states.
- Recordings: only where something has to move. That includes UI that animates on its own (chart draw-ins, hover glows), not just cursor interactions. Record with the cursor hidden; note the cursor path in Notes.
- Live URL: note the viewport and the states to capture. -->

## 5. Slate

| Film | Format | Surface | Status |
|---|---|---|---|
| | clip | | idea |

<!-- Everything planned for this Project, one line each. Format: clip | full. Status: idea | ready | draft | done.
A good first slate is 3 to 5 clips (one per strong Surface or feature) and, if the Project deserves it, one full film that reuses the best of them. -->

---

## Clips

<!-- Copy the card below for each clip. Only the first three fields are required; the rest fall back to the Look table above.

Clips skip the Shot list and storyboard: the focus path is the Shot list. Review happens at the draft render (batch several clips into one review).

Patterns, taken from the reference clips. Name one, or describe your own:
- Hold: one screen, one slow move. The safe default.
- Reveal: open on a fragment (a corner, an edge, a dark screen) and push or pull until the whole view is there.
- Bookend: wide, then one or two close-ups, then back to the same wide. Loops cleanly. (TLDR)
- Drift: bare plane tilted in space, shallow focus, slow drift across 2 or 3 components with focus racking between them. (Evil Charts)
- Scroll: tilted page scrolls past; the product's own section headings act as titles. (Vercel)
- Orbit: device turns slowly while the screen plays a recording. Mostly for phone apps.

Worked example, from the TLDR reference:
### Clip: Referral leaderboard
- Surface: Dashboard (assets/dashboard.png)
- Notice: streamers earn from referrals, and Pro is unlocked
- Focus path: dark screen corner → full dashboard → leaderboard → Pro access card → full dashboard
- Pattern: Bookend, opening as a Reveal
- Look: monitor frame, purple brand glow
- Length: 9s, loops
-->

### Clip: <name>

- **Surface:**
- **Notice:**
- **Focus path:**
- **Pattern:**
- **Look:** project default
- **Edits:** project default
- **Length:** 8 to 12s
- **Loop:** yes

<!-- Surface: one row from section 4. One Surface per clip keeps it a clip; two or more and it is drifting toward a full film.
Notice: the one thing a viewer should take away, in a short line. If you cannot say it, the clip has no reason to exist.
Focus path: 2 to 4 areas of the Surface, in order, joined with arrows. Name what is there ("leaderboard", "Pro card"), not coordinates. Each area becomes an angle; the first and last usually show the whole view.
Pattern: one from the list above.
Edits: 9:16 usually drops the widest angle and starts closer.
Text: add a "Text:" line only if the clip needs a word the UI does not already say. -->
