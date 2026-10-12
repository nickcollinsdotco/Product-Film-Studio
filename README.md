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

Drop an image (or capture a URL: common cookie banners are hidden, and you can list extra CSS selectors to hide), pick a background colour and settings, drag a focus area on the thumbnail (optional: zoom in at the end, open on it and pull out, or zoom in and out before scrolling) and drag the dashed line to set where scrolling stops, then Render. MP4s land in `renders/quick/`; temporary render files are deleted after each render, and uploads unused for 7 days are deleted when the server starts.
