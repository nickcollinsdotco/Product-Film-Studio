---
status: accepted
---

# Primitives tween renderer-neutral scene state; each Renderer draws it

Primitives (`camera.pushIn()`, `surface.focus()`, ...) tween one renderer-neutral scene state: Camera, Surfaces, focus and so on. Each Renderer is a single draw function that turns that state into a frame on every timeline update: CSS 3D now, Three.js later. The Library stays an external file, synced into each Project (ADR-0004).

We compared this with native element tweens and a hybrid in a spike (2026-10-08, HyperFrames 0.8.141; [report](../spikes/q1-renderer-spike.md)). The required criterion, retiming at the Shot level in HyperFrames Studio, worked identically for every option. Studio only edits the host clip's timing in the Edit, never the Shot template, so it didn't decide anything. The hybrid we had preferred bought nothing. Studio shows helper-generated tweens read-only, and its only way to edit them is "Unroll", which replaces the Primitive call with a raw tween. Only literal inline tweens are directly editable, and those aren't Primitives. Scene state is the only shape that keeps Shot templates purely semantic, makes the Renderer swappable for Three.js (ADR-0002) and gets derived values like depth of field right in general.

## Consequences

- Keyframe-level editing inside a Shot is not available in Studio, and `hyperframes keyframes` can't see motion inside Shots. That was a nice-to-have; finer timing changes go through Claude. lint, `check` and its motion audit still work, because they run the composition.
- A Shot's internal timeline never stretches in Studio. Moving a Shot shifts it, trimming the end cuts it, trimming the start offsets it, and extending it holds the last frame. A Landing therefore sits at a fixed offset inside its Shot: you align it in Studio by moving the Shot, and changing the offset itself goes through the Shot's parameters.
- Rules for every Shot template:
  - **No clip timing on inner elements.** The host clip alone controls visibility; inner `data-start`/`data-duration` make an extended Shot go blank.
  - **Prefix inner ids per template.** A shared id such as `#camera` makes HyperFrames turn off its scene-swap optimisation.
  - **Ship a `*.motion.json` sidecar.** That way `check` verifies the template's motion, which the keyframe tools can't see.
- Transitions are owned by the Edit and written as literal tweens on the Shot's host clip. Studio moves and scales them along with the Shot when it is retimed.
