# 02: Focus area overlay

**What to build:** A command that draws a Screen's Focus areas (from its sidecar, loops ticket 09 format) as labelled boxes on the Screen, for approval in one reply.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Reads `<screen>.areas.json` (1x px boxes at the stored layout width) and draws each box with its name on the Screen, scaled to the Screen's real resolution
- [ ] Writes one overlay image, using the image library already in the repo
- [ ] Tested on a synthetic Screen and sidecar
