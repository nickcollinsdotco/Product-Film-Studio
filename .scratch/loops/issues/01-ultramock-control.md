# Ultramock control

Type: task (user)
Status: open

Export the like-for-like control from Ultramock Pro: the VR website Screen, the same two focus areas, one focus shift, with tilt, Backdrop (dark void with Backlight) and duration as close as Ultramock allows. 60fps, highest resolution. If it can't export 4:3, export 16:9 at 4K; 02 centre-crops it and notes the crop.

Optional, your call: a second control, a full Bookend made in Ultramock, to see whether it can make the Loop shapes at all.

Done when: the export and the Screen it used are in `references/ultramock/` (git-ignored), with the focus areas noted here.

## Comments

**2026-10-09, free-tier control made.** Files are in `references/ultramock/` (git-ignored). The Screens are in `projects/deo-vr/assets/_source/`: `home-hero-1512x982@3x.png` (4536×2946) and `home-full-1512@3x.png` (4536×14388, under the 16k texture limit, so a desktop full page needs no tiling).

- **Free-tier limits.** Video: 16:9 1280×720 only, Low or Med quality (Med is about 7 Mbps), 30fps, no motion blur, watermarked; square and portrait are locked. Stills: PNG at 4:3 1920×1440, free but watermarked. The user saw 4:3 video on Pro, so 4:3 is no longer a reason to build.
- **Blur modes:** None, Radial, Directional (screen-space gradient: strength, falloff, angle, position, bokeh), Tilt Shift, and Lens (new, presumably depth-based). Directional is close to our Version 1; Lens to Version 2.
- **`control-free.mp4`:** 8.97s, 30fps, no audio. No hard cuts detected: continuous moves from a wide, to a steep close on the nav, to the hero title, back out, and ending low on the thumbnail row and category chips. It doesn't return to its opening framing, so it's a Tour, not a Bookend.
- **`control-free 01.png` / `02.png`** (1920×1440): in-focus type is very crisp, with fine grain throughout and depth falloff in both directions on 02 (near and far edges blurred). That's the sharpness bar for 02. 01 leaves the top half of the frame empty black.
- The large watermark at the bottom left covers part of the Screen in both stills.

**Settings and focus areas (from the user's screenshots).** Coordinates are approximate, as fractions of the 1512×982 Screen (x0–x1, y0–y1), read off Ultramock's editor:

| # | Area | x | y | Used |
|---|---|---|---|---|
| 1 | hero video (left) | 0.02–0.39 | 0.12–0.68 | |
| 2 | nav actions (Queue, Headset view, Library) | 0.71–0.97 | 0.00–0.06 | yes: still 01 |
| 3 | CTA row (Step inside, Watch in VR, ✓) | 0.66–0.86 | 0.59–0.69 | yes: still 02 |
| 4 | "180° drag to look" pill | 0.50–0.64 | 0.12–0.18 | |
| 5 | category chips, left (partly hidden by the panel) | 0.18–0.30 | 0.83–0.97 | |

The video used all five, via Auto-motion: 3D, speed Med, **Infinite loop off**. Infinite loop is a candidate for testing whether Ultramock can make a Bookend.

| Group | Setting | Value |
|---|---|---|
| Surface | reflection | 0 |
| | border radius | 0.062 |
| | rotate X / Y | 0 / 0 |
| Camera | X / Y / Z axis | −26 / 7 / 9 |
| | FOV | 45 |
| | zoom | 1.07 |
| | pan X / Y | −0.57 / 0.09 |
| | animated (keyframed) | X, Y, Z, zoom, pan |
| Blur | mode | Lens, Auto (focus follows the focus area) |
| | strength | 7.5 |
| | focus range | 0.80 |
| Effects | sharpen | 0.13 |
| | grain | 0.15 |
| | pixel grid | 0.06 (a subtle display-pixel texture) |
| | bloom | none listed |

Backdrop: plain black, with no glow visible.

**2026-10-09, closer controls.** All are 1280×720, 30fps, Lens blur, focus areas `title → rail` matched to the look test by eye. Some extra camera angle change remains. Contact sheets are in `.scratch/scope-review/ref-frames/cf-*-sheet.png`.

- **`control-free-02.mp4`** (5.97s): one shift, title → rail, ending on the rail. **This is the like-for-like control for 02.**
- **`control-free-02-looped.mp4`** (7.97s, Infinite loop on): title → rail → back to title. Results:
  - **Pose matches:** the last frame against frame 0 is 31.8 dB PSNR.
  - **Speed doesn't match.** It eases to rest at the end (consecutive frames 38–39 dB), then frame 0 → 1 is the biggest step in the clip (19.4 dB; the next steps are 24.9, 25.8, 26.6 and so on). So it lurches out of the Seam from a standstill.
  - ADR-0011's speed check would fail it.
- **`control-free-03.mp4`** (3.97s): not a control (the user just liked it).
- **`control-free-04.mp4`** (7.97s, pale grey Backdrop): title → rail → back. Pose matches (30.5 dB), and both ends are near rest: frame 0 → 1 is 38.1 dB, the last steps 37–39 dB. **A clean Bookend-style Seam.** Which settings differ from 02-looped is still to be asked.
