# 01: Tracer: one Hold Loop, end to end

**What to build:** The smallest path through the v1 architecture ([spec](../spec.md)): a fixture Project with one Loop of one Hold Shot, synced Library, exported as a Draft at its primary Frame size. Proves the architecture; not a general framework. Lift Quick Loop's layout and state maths rather than rewriting them; leave Quick Loop unchanged.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Loop model (pure, no DOM) returns scene state for a Loop of Hold Shots at any t; moves are fractions of the Shot's duration
- [ ] CSS Renderer draws that state: no Device frame (rounded card) and a brand-colour Backdrop
- [ ] Hold Shot template is a sub-composition that sizes its paused timeline from its host clip's duration (loops ticket 05) and draws on update; follows ADR-0007's template rules
- [ ] Project settings (brand colour, Backdrop, Device frame, primary Frame size) are loaded synchronously by the Loop entry
- [ ] A sync command copies the Library into a Project and stamps its version (ADR-0004)
- [ ] A small synthetic fixture Project and Loop (generated Screen, no client material) live in the tool repo
- [ ] The export command renders a Draft (half size) at the Loop's primary Frame size via a temporary entry copy, and deletes its temporary files
- [ ] The fixture Loop previews in HyperFrames Studio at its primary Frame size
- [ ] `node --test` covers: a stretched Shot reaches the same states at the same fractions (Loop model); the Draft export produces a file of the expected size and duration and leaves no temporary files (export)
- [ ] A rendered frame of the fixture is inspected before calling it done
