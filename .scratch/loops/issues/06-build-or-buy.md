# Build or buy, and record the look-test results

Type: grilling
Status: resolved
Blocked by: 01, 02

Build only if the Three.js version gets close to the control and the user wants one of: full Films, UI that animates as UI, one consistent system per Project. Otherwise use Ultramock for Loops and build only the full-Film layer. Also settle from 02: resolution, Seam thresholds, the file-size cap and grain policy. Run via `/grill-with-docs`; update ADR-0010 and ADR-0011.

Done when: decided, and the ADRs record it.

## Answer

Decided by the user on 2026-10-10, without a Pro control: **build, lightly** ([ADR-0012](../../../docs/adr/0012-v1-is-light-css-loops.md)). The reasons are full Films and one consistent system per Project, not beating Ultramock's image quality.

- v1 is CSS 3D in HyperFrames only, guided by the Steel Hat clips (flat brand colour, phone and laptop frames, bold tilts and moves, no depth of field, no grain). Three.js, shaped depth of field, bloom and grain wait for a later version, which picks up the look test findings (02).
- The Ultramock Seam comparison is dropped: the user puts the lurch down to their own setup. Ultramock is a source of camera-move ideas; Ultramock Pro (about $20 a month, PNG sequence export) is the fallback for Loops if the CSS versions aren't good enough.
- **Resolution:** not settled from 02; the v1 grilling decides it.
- **Seam thresholds:** none. The end matches the start by eye, plus a basic automated comparison (ADR-0011 marked).
- **File-size cap:** 6 MB for the portfolio Rendition, at 5 Mbps; a longer Loop drops the bitrate to fit.
- **Grain policy:** no grain in v1.
- **Destinations:** portfolio first. Instagram and X get no destination-specific encoding, sizing or tests until a real post looks bad; one export command takes ratio (4:3, 16:9, 9:16, 4:5), size and length. X's 960×720 finding (04) is kept for then.
- Tickets 07–12 are shelved.
