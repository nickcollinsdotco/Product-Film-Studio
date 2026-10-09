# Proof of concept: HTML → GSAP → HyperFrames → MP4

One composition, one animated box, rendered locally to `renders/poc.mp4`
(1920×1080, 30 fps, H.264, 4 s). It exists only to show the pipeline works
end to end.

## What was installed

| Thing | Version | Where | How |
| --- | --- | --- | --- |
| Node / npm | 24.18.0 / 11.16.0 | already present | — (HyperFrames needs Node ≥ 22) |
| FFmpeg + FFprobe | 9.0.2 (gyan.dev full build) | `%LOCALAPPDATA%\Microsoft\WinGet\Links\` (on user PATH) | `winget install Gyan.FFmpeg` |
| HyperFrames CLI | 0.8.141, pinned | `node_modules/` (devDependency) | `npm install` |
| Chrome Headless Shell | 152.0.7977.30 | `~/.cache/hyperframes/chrome/` | `npx hyperframes browser ensure` |
| HyperFrames Claude Code plugin | 0.8.141 | `.claude/settings.json` (project scope) | `claude plugin marketplace add heygen-com/hyperframes --scope project` then `claude plugin install hyperframes@hyperframes --scope project` |
| GSAP | 3.14.2 | loaded from jsDelivr CDN in the composition | — |

HyperFrames renders with its own pinned headless Chrome rather than the system
Chrome. That keeps pixel output stable across machines. On this machine it was
also required: `chrome.exe --version` hangs on Windows, so `doctor` could not use
the system install.

The plugin is declared in `.claude/settings.json`, so anyone who opens this repo
in Claude Code gets prompted to install it. Its router skill is
`/hyperframes:hyperframes`; the domain skills are `hyperframes-core`,
`hyperframes-animation`, `hyperframes-cli` and the rest.

## How HyperFrames works here

A HyperFrames **project** is a folder containing an `index.html` composition, a
`hyperframes.json` config and a `meta.json`. The POC project is `films/poc/`.
The repo root holds the pinned CLI and the npm scripts. Each future film can be
its own folder under `films/`.

The composition is plain HTML. HyperFrames reads its timing from `data-*`
attributes:

- The root `<div data-composition-id="main" data-width="1920" data-height="1080" data-duration="4">`
  sets canvas size and video length. `data-duration` decides the render length,
  not the GSAP timeline.
- Any element with `data-start` and `data-duration` is a **clip**. The framework
  shows and hides it at those times. `class="clip"` is a convention the linter
  expects. `data-track-index` only sets the Studio timeline lane.

For rendering, HyperFrames opens the page in headless Chrome, **seeks** the
timeline to each frame (`t = frame / fps`), captures it, and streams the frames
to FFmpeg. There is no real-time playback, so the output is deterministic.

## How GSAP is used

```js
const tl = gsap.timeline({ paused: true });
tl.fromTo("#box", { x: -600, opacity: 0 }, { x: 600, opacity: 1, duration: 3, ease: "power2.inOut" }, 0.5);
window.__timelines["main"] = tl; // key must equal data-composition-id
```

- Create exactly one timeline per composition, **paused**. HyperFrames drives it
  by seeking and never calls `play()`.
- Register it on `window.__timelines[<composition-id>]`. The runtime creates
  that registry before your scripts run.
- Initial state goes in `fromTo`, not in a CSS `transform`. The linter rejects a
  CSS transform and a GSAP tween on the same property
  (`gsap_css_transform_conflict`).
- No `Math.random`, `Date.now`, timers or infinite `repeat: -1` on render-critical
  motion. Each frame must depend only on time.

## Commands

Run all of them from the repo root.

```bash
npm install            # once: installs the pinned CLI
npm run doctor         # checks environment (FFmpeg, Chrome, Node)
npm run check:poc      # lint + runtime + layout + motion + contrast audit
npm run preview:poc    # Studio preview with live reload (foreground, Ctrl+C to stop)
npm run render:poc     # render to renders/poc.mp4
```

The preview runs at `http://localhost:3002/#project/poc`. If 3002 is taken it
moves to the next free port, so read the URL it prints. For agent sessions use
`npx hyperframes preview films/poc --background`, plus `--status` and `--stop`.

Useful render flags: `--quality draft|looks|delivery` (default `looks`),
`--fps 60`, `--gpu` (NVENC encode).

## Where the MP4 goes

`renders/poc.mp4`, which is git-ignored. Without `--output`, HyperFrames writes
timestamped files to `renders/<project>_<date>_<time>.mp4` inside the project
folder.

Last verified render: 40.5 KB, 4.0 s, 120 frames, h264/yuv420p, rendered in
9.3 s using `drawelement capture · hardware gpu` on an RTX 5070 Ti.
