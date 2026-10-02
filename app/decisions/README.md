# Architecture Decision Records (ADRs)

One file per decision. Each records **what** was decided, **why**, the alternatives rejected, and **when to revisit**.

Rules:
- Never rewrite a past decision. To change one, add a new ADR and mark the old one `Superseded by ADR-XXX`.
- Status values: `Accepted`, `Superseded`, `Deferred` (agreed direction, not yet started).
- Keep each ADR short. Details belong in specs, plans live in [../strategy-2026.md](../strategy-2026.md).

## Index

| # | Decision | Status | Date |
|---|---|---|---|
| [001](./001-separate-native-mobile-app.md) | Web stays Vue; mobile is a separate React Native (Expo) app | Accepted | 2026-10-02 |
| [002](./002-monorepo.md) | Monorepo: `apps/web`, `apps/mobile`, `packages/shared`, `packages/editor` | Accepted | 2026-10-02 |
| [003](./003-remove-ionic-from-web.md) | Remove Ionic and Capacitor from the web app | Accepted | 2026-10-02 |
| [004](./004-offline-local-snapshot-dexie.md) | Offline = read-only local snapshot in IndexedDB (Dexie); no sync engine for now | Accepted | 2026-10-02 |
| [005](./005-data-access-layer.md) | All data access goes through one layer in `packages/shared`, with swappable storage | Accepted | 2026-10-02 |
| [006](./006-shared-songcode-editor.md) | One CodeMirror SongCode editor, embedded in a WebView on mobile | Accepted | 2026-10-02 |
| [007](./007-github-project-management.md) | Project management in GitHub Issues + Projects | Accepted | 2026-10-02 |
| [008](./008-knowledge-base.md) | Decisions and notes live in `livenotes-documentation` (Markdown) | Accepted | 2026-10-02 |
