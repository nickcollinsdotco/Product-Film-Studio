# 03: A natural length for each Shot template

**Type:** task
**Status:** open
**Blocked by:** —

snapcn lists a natural length for every component (for example `screen-recording` 4.6s, `capture-reveal` 4.3s, `cursor-track` 4.4s) and their anti-patterns file starts with "clipping a component by under-budgeting its Sequence".

Our Shots stretch to fit (ADR-0012, time-based timing), so nothing clips, but a Shot stretched too far or squeezed too hard looks wrong. Give each Library Shot template a stated natural length and a sensible range, in its docs and readable by agents, so a Loop's length is budgeted from its Shots instead of guessed.

Feeds B: the tool can pick the Loop length from the Screen's height.
