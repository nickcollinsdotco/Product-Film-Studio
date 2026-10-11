# 05: Frame sizes, fps and the portfolio Rendition

**What to build:** The export renders any Loop at any Frame size, length and frame rate, as a Draft or a Final render, and writes the portfolio Rendition within the hard 6 MB limit.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Presets Landscape 1600×900, Story 900×1600, Square 1600×1600, Portrait 1280×1600, Classic 1600×1200; custom W×H accepted, odd dimensions rejected with a message
- [ ] A length option scales every host clip's start and duration (and Edit-owned Transitions) proportionally in the temporary copy
- [ ] Frame rate defaults to 60 and can be overridden; motion speed and duration don't change with it
- [ ] Final renders at full size; Draft at half size
- [ ] Rendition: H.264 High, yuv420p, faststart, no audio; 5 Mbps, lowered to fit 6 MB for long Loops; actual file size checked after encoding, fails clearly if over 6 MB
- [ ] Output named by Loop, Frame size and Draft or Final; temporary files deleted
- [ ] Tests (export, small sizes): dimensions per preset and custom, odd size rejected, duration after a length change, fps in the output, Rendition within 6 MB. Loop model: fps doesn't change state at a given t
