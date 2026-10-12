# 05: Frame sizes, fps and the portfolio Rendition

**What to build:** The export renders any Loop at any Frame size, length and frame rate, as a Draft or a Final render, and writes the portfolio Rendition within the hard 6 MB limit.

**Blocked by:** 01

**Status:** done

- [x] Presets Landscape 1600×900, Story 900×1600, Square 1600×1600, Portrait 1280×1600, Classic 1600×1200; custom W×H accepted, odd dimensions rejected with a message
- [x] A length option scales every host clip's start and duration (and Edit-owned Transitions) proportionally in the temporary copy
- [x] Frame rate defaults to 60 and can be overridden; motion speed and duration don't change with it
- [x] Final renders at full size; Draft at half size
- [x] Rendition: H.264 High, yuv420p, faststart, no audio; 5 Mbps, lowered to fit 6 MB for long Loops; actual file size checked after encoding, fails clearly if over 6 MB
- [x] Output named by Loop, Frame size and Draft or Final; temporary files deleted
- [x] Tests (export, small sizes): dimensions per preset and custom, odd size rejected, duration after a length change, fps in the output, Rendition within 6 MB. Loop model: fps doesn't change state at a given t

## Notes (2026-10-11)

- **Usage.** `npm run library:export -- <project> <entry> --draft|--final [--size Story|1080x1350] [--length 8] [--fps 30]`. Size defaults to the Loop's primary Frame size; Draft halves it (a custom size's odd half is rounded to even).
- **Rendition.** HyperFrames renders a CRF 10 intermediate to a temp folder; ffmpeg encodes two-pass x264 (High, yuv420p, `+faststart`, `-an`, preset slow) at 5 Mbps, or `6 MB × 8 × 0.95 / duration` when lower (5 Mbps holds to about 9.1s). If the file still comes out over, one re-encode at a bitrate lowered by the overshoot; still over: deleted, clear error. 6 MB is read as 6,000,000 bytes (stricter).
- **Names.** `<loop>-<W>x<H>-<draft|final>`, plus `-<len>s` and `-<fps>fps` only when overridden, so no two exports overwrite each other.
- **The Seam check now runs on the temporary copy** (target size, scaled timing), so its Δ and D are what renders.
- **Transitions:** none exist yet (cuts only), so length scaling covers the root and host clips. Scale Edit-owned Transition tweens in `scaleLength` when the first one lands.
- **Verified on renders** (fixture `hold-scroll`, Final, 60fps): Landscape 5.26 MB, Story 5.37 MB, both High@4.2; `--length 20` dropped to 2.28 Mbps, 5.74 MB, and its frame at 47% matches the 8.5s Loop's at 47%; type clean. Story renders, but the card stays small in the tall frame: that's 06's portrait layout rule.
