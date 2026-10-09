# The Library is copied into each Project, not referenced

The Library (Primitives, Renderers, Shot templates) has one source of truth at the repo root, and a sync step copies it into each Project. Projects cannot reference it with a `../` path: HyperFrames renders these correctly, but Studio preview resolves paths against the project root and returns 404, and `hyperframes lint` flags it as an error (`invalid_parent_traversal_in_asset_path`, verified 2026-10-08). Symlinks were rejected as fragile on Windows.

## Consequences

- Each Project is self-contained and keeps rendering the Library version it was synced with. Updating a finished Film to newer Shot templates requires a deliberate re-sync.
- Sync is deliberately minimal: copy the whole Library and stamp its version. Because each Project has its own git history (ADR-0008), a re-sync shows up as a reviewable, revertable diff, so no protective manifest is needed.
