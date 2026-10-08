# Shot templates use renderer-agnostic primitives; CSS 3D is the first renderer

Shot templates express intent through semantic Primitives (`camera.pushIn()`, `surface.tilt()`, `surface.focus()`, `surface.present()`), never through CSS transforms or Three.js objects directly. CSS 3D is the first Renderer: text stays crisp, recordings play natively, and it covers the flat-screens-in-space look of the references. Three.js would get us photoreal device bodies and true depth of field, but costs far more in complexity and render time, so it is deferred. It will implement the same Primitives later, so existing Shot templates don't need to be rewritten. A device is a Surface with a Device frame, not a separate Primitive.

## Consequences

- Until the Three.js Renderer exists, device frames are 2D (none / browser / phone / laptop).
- Primitives must not leak Renderer-specific options into a Shot template's parameters.
- How Primitives drive a Renderer (scene state or native element tweens) is decided separately; see ADR-0007.
