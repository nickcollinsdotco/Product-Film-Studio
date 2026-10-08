# One HyperFrames project per Project; Films are folders, Edits are entry files

A Project is a single HyperFrames project. Product brand, assets, the synced Library and one-off Shot templates sit at its root. Each Film is a folder (`films/<film>/`) holding its Brief, Shot list and one top-level entry file per Edit (`edit-16x9.html`, `edit-9x16.html`). The alternative, one HyperFrames project per Film, would duplicate brand and assets for every Film.

This relies on HyperFrames Studio listing every top-level entry file, including ones in subfolders, and opening or rendering each one (verified 2026-10-08 on 0.8.141). The CLI's `hyperframes compositions` lists only `index.html`, so scripts render Edits explicitly with `hyperframes render --composition films/<film>/edit-16x9.html`.
