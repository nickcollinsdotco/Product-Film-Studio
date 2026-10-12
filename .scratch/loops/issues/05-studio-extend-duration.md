# Does a Studio extend update a Shot's root.dataset.duration?

Type: research
Status: resolved

ADR-0011 needs a Bookend's last Shot to stretch when it's extended. HyperFrames catalog components (`focus-swap`) read `root.dataset.duration` to fit their host. Verify in Studio 0.8.141 that extending a host clip changes the value the sub-composition sees, in preview and in render.

Done when: answered here, with a fallback if it doesn't.

## Answer

**No, but the host clip's value works.** Probe: `.scratch/studio-extend/` (host mounts `compositions/probe.html` at `data-duration="3"`; the Shot root declares `2`; the Shot prints what it sees and fills a bar over the value it reads). Evidence frames in `.scratch/studio-extend/evidence/`.

- `root.dataset.duration` is **always `undefined`** inside a mounted Shot, in snapshot and render alike. On mount HyperFrames flattens the Shot's root into the host clip and strips its timing attributes (`FLATTENED_INNER_ROOT_STRIP_ATTRS` in `packages/core/src/runtime/flattenedRoot.ts`), and the scoped `document.getElementById("root")` returns that stripped root. So `focus-swap` always falls back to its 1.5s default when mounted; its demo hides this because the host also says 1.5. (Same code path as the probe; `focus-swap` itself not rendered.)
- `root.parentElement` is the host clip, and its `data-duration` is the host's value (`3`), in snapshot and render.
- **Studio extend** (dragging the clip's right edge 3s → 5s) writes `data-duration="5"` on the host clip in `index.html`, adds `data-playback-start="0"`, and also refits the root's `data-duration` to the last clip end (6 → 5).
- **Render after the extend:** the Shot reads `5` and its move stretches: bar 50% at 2.5s, 80% at 4.0s (`render-after-extend-t2.5-t4.0.png`).
- **Studio preview after the extend:** stale until the page reloads. Studio patches clip timing live and doesn't re-run the Shot's script (its "script ran at" stamp didn't change), so the move is still built for 3s. After a reload it reads `5`.

**Fallback (use this):** a Library helper, `shotDuration(root)`, that reads the host clip: `root.parentElement.getAttribute("data-duration")`, then `data-hf-authored-duration` (the live preview moves the value there after init), then the Shot's own declared default. Bookend last Shots build their timeline from it. One place to change if HyperFrames starts passing the value through `root.dataset.duration`.

Consequences for ADR-0011: the "Bookend's last Shot is fixed to the end" rule is implementable, with two caveats. Studio preview needs a reload to show a stretched move (render is right). And Studio refits the Edit's duration D to the last clip end, so extending the last Shot moves D with it, which is what a Bookend wants.

