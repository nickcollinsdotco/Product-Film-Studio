# 01: Tracer: one Hold Loop, end to end

**What to build:** The smallest path through the v1 architecture ([spec](../spec.md)): a fixture Project with one Loop of one Hold Shot, synced Library, exported as a Draft at its primary Frame size. Proves the architecture; not a general framework. Lift Quick Loop's layout and state maths rather than rewriting them; leave Quick Loop unchanged.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Loop model (pure, no DOM) returns scene state for a Loop of Hold Shots at any t; moves are fractions of the Shot's duration
- [x] CSS Renderer draws that state: no Device frame (rounded card) and a brand-colour Backdrop
- [x] Hold Shot template is a sub-composition that sizes its paused timeline from its host clip's duration (loops ticket 05) and draws on update; follows ADR-0007's template rules
- [x] Project settings (brand colour, Backdrop, Device frame, primary Frame size) are loaded synchronously by the Loop entry
- [x] A sync command copies the Library into a Project and stamps its version (ADR-0004)
- [x] A small synthetic fixture Project and Loop (generated Screen, no client material) live in the tool repo
- [x] The export command renders a Draft (half size) at the Loop's primary Frame size via a temporary entry copy, and deletes its temporary files
- [x] The fixture Loop previews in HyperFrames Studio at its primary Frame size
- [x] `node --test` covers: a stretched Shot reaches the same states at the same fractions (Loop model); the Draft export produces a file of the expected size and duration and leaves no temporary files (export)
- [x] A rendered frame of the fixture is inspected before calling it done

## Notes (2026-10-11)

- **Sub-composition scripts are scoped.** HyperFrames wraps each template's script with its own `__hyperframes.getVariables()` and `window.__timelines` per mounted instance, so the template's inline script must read its variables and register its timeline itself; Library code called from it can't (`library/shot.js` returns the timeline). The host clip's `data-composition-id` matches the template's (`hold`), as in the loops ticket 05 probe. Two instances of one template in one Loop are ticket 03's to verify.
- **Runtime paths.** Static `src` paths in an entry under `films/` resolve from the Project root, but an `img.src` set at runtime resolves against the entry's folder, so `shot.js` resolves Screen paths against the Library's own URL.
- **Studio needs a root `index.html`** to open a Project; the fixture has a placeholder.
- Draft export of the fixture: 800×450, 60fps, 240 frames, 4.000s, about 10s to render.
