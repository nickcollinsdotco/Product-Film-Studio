# 10: Screen from a live URL

**What to build:** Quick Loop's URL capture as a command that writes a Screen into a Project (ADR-0006). Off the first Loop's critical path.

**Blocked by:** 01

**Status:** done

- [x] Captures a full page with headless Chrome, hiding common cookie banners and listed selectors, at a chosen viewport and device scale
- [x] Writes the Screen into the Project's assets
- [x] Quick Loop's own capture keeps working

## Notes

- `npm run library:capture -- <project> <url> --name <name> [--width 1440] [--height <px>] [--scale 2] [--hide <sel,sel>] [--force]` writes `<project>/assets/_source/<name>-<width>@<scale>x.png`, beside the Project's other Screens. `<width>` is the Screen's layout width for its `.areas.json` sidecar. An existing Screen is only replaced with `--force`. Scale must be a whole number.
- The capture lives in `tools/library/capture.mjs`; Quick Loop's `/capture` now calls it (same viewport table), so both get the same fixes. Checked: Quick Loop `/capture` on a local page hid a Cookiebot banner.
- Added iframe-based consent tools (Sourcepoint, Funding Choices, iubenda, CookieYes and others) to the default hide list: on bbc.co.uk the Sourcepoint dialog showed through before, since the text check can't see inside its iframe. Recaptured and inspected: gone.
