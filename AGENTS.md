# Agent Instructions

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Working principles

Develop this project intelligently, not mechanically. Use skills when they materially improve the outcome. Don't add process for its own sake, and don't invoke or recommend skills for trivial changes.

- grill-with-docs: when an architectural or product decision is ambiguous or expensive to change.
- prototype: when the uncertainty is mainly visual or experiential rather than about implementation.
- to-spec: when a capability has been explored and its requirements are stable.
- to-tickets: when a spec is too big for one session and needs breaking into slices.
- implement: for building from a spec or tickets. It runs tdd and code-review itself.
- handoff: before ending a session partway through a task.

At pivotal moments, tell me briefly when a skill would materially improve the result. grill-with-docs, to-spec, to-tickets, implement and handoff only run when I type them, so recommend them rather than trying to run them yourself.

For anything affecting visual quality, animation, composition or timing, rendered output is the validation. Render it and inspect the actual frames or screenshots before calling the work done.

Prefer quality over process and evidence over speculation. Don't build infrastructure before a real use case needs it.

## Environment

Windows. `.claude/skills/` entries are junctions to `.agents/skills/`, so edit skills in `.agents/skills/`.