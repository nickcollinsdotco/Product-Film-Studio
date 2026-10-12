# Each Project is its own git repository, outside the tool repo's history

> **Nick's own setup (2026-10-12):** one person, so all of Nick's Projects share one private repo at `projects/` (`studio-projects`), still outside the tool repo. Only text is committed (entry files, Focus areas, Project sheets, settings, the synced Library); Screens and other media are git-ignored and kept on the machine under its backup, since they are frozen once captured (ADR-0006) and history would only add weight. One repo per Project stays the recommendation for the general tool.

Projects live under `projects/`, which the tool repo ignores. Each Project is its own git repository, pushed to its own private remote. This keeps client and NDA material out of the tool repo, which stays safe to share, while every Project keeps full history: Studio timing edits, Library re-syncs and approvals are all diffable and revertable, and the remote doubles as a backup.

## Considered Options

- Committing Projects in the tool repo: rejected because it mixes private client assets into a shareable tool.
- Git-ignored Projects with no history: rejected because Studio timing edits and Library re-syncs could not be reviewed or undone.
- One separate private repo for all Projects: rejected because it gives the same privacy with more coupling between unrelated products.
