# Product-Film-Studio
A code-driven system for creating cinematic product films with HyperFrames, GSAP and FFmpeg.

## Status

Proof of concept only: one HTML/GSAP composition rendered locally to MP4. See [docs/poc.md](docs/poc.md).

```bash
npm install
npm run check:poc    # validate
npm run preview:poc  # Studio preview
npm run render:poc   # -> renders/poc.mp4
```

Requires Node ≥ 22 and FFmpeg on PATH.

## Quick Loop

Turn one screenshot (a full-page website capture or a Figma frame export) into a scrolling MP4.

```bash
npm run quick        # -> http://localhost:4321
```

Drop an image, pick a background colour and settings, drag a focus area on the thumbnail (optional: the shot scrolls to it and zooms in), then Render. MP4s land in `renders/quick/`.
