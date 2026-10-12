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
- handoff: before ending a session partway through a task, or with items still waiting on Nick.

At pivotal moments, tell me briefly when a skill would materially improve the result. grill-with-docs, to-spec, to-tickets, implement and handoff only run when I type them, so recommend them rather than trying to run them yourself.

For anything affecting visual quality, animation, composition or timing, rendered output is the validation. Render it and inspect the actual frames or screenshots before calling the work done.

Prefer quality over process and evidence over speculation. Don't build infrastructure before a real use case needs it.

## Reporting to Nick

When you hand control back after meaningful work, end with a **For you** block after a horizontal rule:

    **For you**

    1. **Decide:** <question> — I recommend <option>: <consequence>.
    2. **Do:** <action> — <link, file path or where to click>.
    - **Blocked:** <what> — waiting on <who or what>.
    - **Next:** <one action> — I'm on it | waiting for you.

- Include only lines with content; never invent a decision. Number items when there's more than one so Nick can answer by number. If nothing needs him: `**For you:** nothing — next, <action>`.
- **Decide** is for product, visual or priority calls that need Nick's judgement. Recommend one option. Settle routine, reversible implementation details yourself from the ADRs, specs and GLOSSARY.
- **Do** is for things only Nick can do: export from a tool, check a render, upload to the portfolio, use his accounts. Give a link, file path or exact place to click. Slash commands such as `/implement` are fine; shell commands are not.
- Carry every unanswered Decide or Do into each later block, marked `(open since <YYYY-MM-DD>)`, until it is resolved, deferred or cancelled. Check it is still open before repeating it.
- Keep working on anything that doesn't depend on Nick; a non-blocking Do never stops work.
- Don't reopen settled product decisions (ADRs, resolved tickets) without new evidence. Technical choices can change for a concrete reason.
- Use the full block at milestones, when blocked and at handoff. In routine replies give only open items and the next step. Don't restate the report inside the block.
- Sub-agents reporting to another agent skip the block.

**Status words.** Say which step was actually reached and what you checked: built → tested locally → rendered and inspected (anything visual) → committed → in PR #n → merged → live (on the portfolio) → verified live. Never claim a step without evidence.

**Handoffs** go in `.scratch/handoffs/YYYY-MM-DD-<slug>.md`, not the OS temp folder; the newest is current, and older ones get a Superseded note. Open each with `## Waiting on Nick`: every open Decide and Do with its date, matching the last For you block. Drop resolved items and record the outcome in the ticket, ADR or commit message.

## Environment

Windows. `.claude/skills/` entries are junctions to `.agents/skills/`, so edit skills in `.agents/skills/`.