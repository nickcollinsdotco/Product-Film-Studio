# Content is separate from choreography, through sub-compositions and variables, with no generator

A Project holds its Product brand, assets and Films. A Shot template is a HyperFrames sub-composition that receives its content (Screen, headline, accent, and so on) as variables, so it can be reused for a different product without touching its animation. One-off Shot templates are just custom sub-compositions in the Project. Each Edit's entry HTML places Shots on the timeline, passes their variables and owns the Transitions between them.

We rejected a `film.json`-to-HTML generator because it would overwrite timing changes made in HyperFrames Studio, which we use for review and timing passes.

Variables may go beyond content (scale, camera distance, frame, cursor style), but each Shot template exposes only a few and keeps opinionated defaults. The goal is good films with little configuration, not After Effects rebuilt in JSON.
