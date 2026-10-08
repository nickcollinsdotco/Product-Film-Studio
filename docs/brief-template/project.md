---
project:          # e.g. "TLDR"
type: portfolio   # portfolio | client
client:           # blank for portfolio
live_url:         # if the product is coded and capturable
---

# Project: <name>

**How to use.** Fill this once per Project. Every Loop and full Film for the Project inherits from it, so a Loop card only says what is specific to that Loop. Add Loops as cards at the bottom. A full Film gets its own brief (`film-brief.md`) that points back here.

Values already filled in are the defaults. Change only what differs.

---

## 1. Product (required)

**One line:**
<!-- What it is and who it is for, in plain words. "A dashboard that turns live streams into short clips for streamers." Every Loop should make this a little more believable. -->

**Audience:**
<!-- Who watches. Portfolio: hiring managers and design leads, scrolling fast, no sound. Client: whoever the client is selling to. -->

## 2. Brand (required)

**Sign-off:** on
<!-- on for portfolio, off for client work. A small, neutral mark and name on the final moment of a full Film's end card. Loops have no end card, so they never show it. -->

**Product brand:**
<!-- Link a brand kit (e.g. brands/tldr.md) and skip the lines below, or fill them in from the product itself. -->
- Logo:
- Colours:
- Fonts:
- Rules:

## 3. Look (optional)

| Setting | Default | This Project |
|---|---|---|
| Device frame | None (bare plane) | |
| Backdrop | Backlight: dark void, soft glow in the brand accent | |
| Focus | Shallow, slow rack between focus areas | |
| Camera | One slow move per Shot | |
| Text | None: the product's own type does the talking | |
| Sound | None: Loops are silent; music only for full Films | |
| Edits | 4:3 only (16:9 and 9:16 on request) | |
| Avoid | Device spins, fast whips, fake UI | |

<!-- Device frame: none | browser | phone | laptop. For now Loops use none or phone (a simple phone body with real thickness, not photoreal). A portrait phone in a 4:3 frame leaves a lot of empty Backdrop, so check the composition on the first render.
Backdrop: void (flat near-black) | Backlight (near-black, soft glow in the brand accent) | studio light (pale grey gradient, as in the Vercel reference) | brand colour (flat Product brand colour, as in the Steel Hat clip). Type colour is chosen for contrast against the Backdrop.
Edits: this row is for Loops. Full Films keep 16:9 and 9:16 (see film-brief.md).
Only fill the right-hand column where this Project breaks a default, e.g. a light product shot in studio light. -->

## 4. Screens (required)

| Screen | Asset | Kind | Status | Notes |
|---|---|---|---|---|
| | | screenshot | have | |
| | | live URL | capture | |

<!-- One row per screen or view worth filming. This is the shared list every Loop and full Film draws from.
Kind: screenshot | live URL. Status: have | capture | fix.
- Screenshots: full page or full view at 3x. Loops crop hard (a close-up may use a fifth of the frame), so resolution is what makes them look expensive.
- Pick and stage the data before capturing: realistic names, satisfying numbers, no empty states.
- Live URL: note the viewport and the states to capture.
- Scroll Shots: capture the full page as one tall Screen, and any pinned header on its own. -->

**Other assets (full Films):**

| Asset | File | Kind | Status | Notes |
|---|---|---|---|---|
| Logo | | svg | have | |
| | | recording | capture | |

<!-- Loops use Screens only for now, so recordings are for full Films.
- Recordings: only where something has to move. That includes UI that animates on its own (chart draw-ins, hover glows), not just cursor interactions. Record with the cursor hidden; note the cursor path in Notes. -->

## 5. Slate

| Film | Kind | Screen | Status |
|---|---|---|---|
| | Loop | | idea |

<!-- Everything planned for this Project, one line each. Kind: Loop | full. Status: idea | ready | draft | done.
A good first slate is 3 to 5 Loops (one per strong Screen or feature) and, if the Project deserves it, one full Film that reuses the best of them. -->

---

## Loops

<!-- Copy the card below for each Loop. Only the first three fields are required; the rest fall back to the Look table above.

Loops skip the Shot list and Contact sheet: the focus path is the Shot list. Draft render all the Project's Loops in one batch, with stills at each focus arrival, and review them together at card size on one page. The only approval gate is the Final render.

The bar on the portfolio is the Steel Hat phone clip (references/own/steel-hat-phone.mp4); it sits on the review page next to the Loops, at the same display height. A Loop ships only if:
- its Seam passes its shape's check;
- in-focus type is visibly sharper, judged on paused frames;
- its motion lands on a named focus area.

Every Loop opens on a lit, settled framing. Frame 0 is the poster when autoplay is blocked (Safari Low Power, reduced motion) and the first thing seen on every repeat, so a separate poster image doesn't fix a dark opening.

Shapes. Pick one:
- Bookend: wide, then one or two close-ups, then back to the same wide. The last Shot ends exactly on the first Shot's opening framing and speed, drift included, and is fixed to the end: extending it stretches its move. An automated seam check compares the two.
- Tour: moves from area to area and never returns to its opening framing. (Evil Charts, Steel Hat)
Every Loop closes with a seam from its last Shot back to its first: a cut by default, a dissolve allowed.

Shot templates, taken from the reference clips. Leave the card's field blank and each Shot's template is inferred: a Shot that ends on one area (whole included) is a Hold, and one that passes through two or more named areas (not counting whole) is a Drift. Name a template to override:
- Hold: ends on one area with one slow move, including a push-in from whole or a pull-out to it. The default Shot.
- Reveal: open on a fragment (a corner, an edge, a dark screen) and push or pull until the whole view is there. Never inferred, because a fragment isn't a named area: name it in Shot templates. Only after a cut, never as a Loop's first Shot.
- Drift: passes through two or more named areas on a tilted plane, shallow focus, focus racking between them. (Evil Charts)
- Scroll: tilted page scrolls past; the product's own section headings act as titles. (Vercel, Steel Hat)
- Orbit: device turns slowly. Mostly for phone apps. Not in yet; until it is, the Steel Hat look uses a fixed tilt.

Worked example, adapted from the TLDR reference:
### Loop: Referral leaderboard
- Screen: Dashboard (assets/dashboard.png)
- Notice: streamers earn from referrals, and Pro is unlocked
- Focus path: whole / leaderboard → Pro access card / whole
- Shape: Bookend
- Look: purple Backlight
- Length: 9s
-->

### Loop: <name>

- **Screen:**
- **Notice:**
- **Focus path:**
- **Shape:** Bookend
- **Shot templates:**
- **Look:** project default
- **Edits:** project default
- **Length:** 8 to 12s

<!-- Screen: one row from section 4. One Screen per Loop keeps it a Loop; two or more and it is drifting toward a full Film.
Notice: the one thing a viewer should take away, in a short line. If you cannot say it, the Loop has no reason to exist.
Focus path: 2 to 4 focus areas of the Screen, in order. `→` moves within a Shot; `/` cuts to the next Shot. Name what is there ("leaderboard", "Pro card"), not coordinates; `whole` is the full Screen and never needs drawing. A Bookend starts and ends on the same area, usually whole.
Shape: Bookend or Tour.
Shot templates: optional, one per Shot. Leave blank to infer them from the focus path.
Edits: 16:9 and 9:16 only on request; 9:16 usually drops the widest Shot and starts closer.
Text: add a "Text:" line only if the Loop needs a word the UI does not already say.
Logo: add "Logo: corner" only for client deliveries that travel without a page around them. -->
