# Edits re-lay themselves out per aspect ratio instead of being cropped

16:9 and 9:16 are first-class Edits; 4:5 and 4:3 come later. Each Shot template lays itself out for the target ratio rather than having every Edit cropped from one master, so type, framing and camera paths stay intentional in every ratio. This costs per-ratio layout work in every Shot template. Each Edit is its own entry file, rendered with `hyperframes render --composition`, and Edits of a Film may differ in pacing, order and which Shots they include.
