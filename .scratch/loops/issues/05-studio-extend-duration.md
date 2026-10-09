# Does a Studio extend update a Shot's root.dataset.duration?

Type: research
Status: open

ADR-0011 needs a Bookend's last Shot to stretch when it's extended. HyperFrames catalog components (`focus-swap`) read `root.dataset.duration` to fit their host. Verify in Studio 0.8.141 that extending a host clip changes the value the sub-composition sees, in preview and in render.

Done when: answered here, with a fallback if it doesn't.
