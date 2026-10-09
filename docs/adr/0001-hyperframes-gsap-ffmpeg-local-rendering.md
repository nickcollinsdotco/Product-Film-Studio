# HyperFrames + GSAP + FFmpeg, rendered locally with pinned versions

Films are HTML compositions animated with GSAP. The HyperFrames CLI renders them locally by seeking the timeline frame by frame in headless Chrome and encoding with FFmpeg. We chose this over a timeline editor (After Effects) or a React framework (Remotion) because plain HTML/CSS is the medium Claude Code writes best, and seek-based rendering is deterministic.

The CLI version is pinned in `package.json`. HyperFrames' own pinned headless Chrome is used instead of the system browser, because pixel output drifts between Chrome versions and system Chrome hangs on `--version` on Windows. Upgrading either is a deliberate step, not something that happens automatically.
