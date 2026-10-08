---
status: proposed
---

# How Primitives drive the Renderer: scene state versus native element tweens

Primitives can (a) tween one renderer-neutral scene state that a Renderer redraws each frame, (b) emit GSAP tweens directly on elements, or (c) a hybrid: native element tweens wherever practical, with scene state only for derived values such as depth-of-field blur. (a) makes the Three.js Renderer a true drop-in. But it may hide motion from HyperFrames Studio's keyframe editor and from the linter, and Studio timing edits are an approval gate (and the reason ADR-0003 rejected a generator).

What Studio must support: retiming at the Shot level (moving and trimming Shots, shifting Landings and Transitions in an Edit) is required. Retiming keyframes inside a Shot is only nice to have; finer changes go through Claude. Studio's "Unroll to edit", which rewrites Primitive calls into raw tweens, is undesirable.

The preference is the hybrid, if it works. This stays proposed until a spike of the "push-in plus rack focus" scenario, built all three ways, shows whether each survives Shot-level retiming in Studio and still be checked by `lint`, `check` and `keyframes`. Spike: `.scratch/q1-renderer-spike/`.
