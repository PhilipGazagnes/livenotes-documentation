# Architecture Decision Records (ADRs)

One file per decision. Each records **what** was decided, **why**, the alternatives rejected, and **when to revisit**.

Rules:
- Never rewrite a past decision. To change one, add a new ADR and mark the old one `Superseded by ADR-XXX`.
- Status values: `Accepted`, `Partly superseded`, `Superseded`, `Deferred` (agreed direction, not yet started), `Proposed` (not confirmed yet).
- Keep each ADR short. Details belong in specs, plans live in [../strategy-2026.md](../strategy-2026.md).

## Index

| # | Decision | Status | Date |
|---|---|---|---|
| [001](./001-separate-native-mobile-app.md) | Web stays Vue; mobile is a separate React Native (Expo) app | Accepted | 2026-10-02 |
| [002](./002-monorepo.md) | Monorepo: `apps/web`, `apps/mobile`, `packages/shared`, `packages/editor` | Partly superseded (tooling: 018) | 2026-10-02 |
| [003](./003-remove-ionic-from-web.md) | Remove Ionic and Capacitor from the web app | Accepted | 2026-10-02 |
| [004](./004-offline-local-snapshot-dexie.md) | Offline = read-only local snapshot in IndexedDB (Dexie); no sync engine for now | Partly superseded (009, 010, 012, 014) | 2026-10-02 |
| [005](./005-data-access-layer.md) | All data access goes through one layer in `packages/shared`, with swappable storage | Accepted | 2026-10-02 |
| [006](./006-shared-songcode-editor.md) | One CodeMirror SongCode editor, embedded in a WebView on mobile | Accepted | 2026-10-02 |
| [007](./007-github-project-management.md) | Project management in GitHub Issues + Projects | Accepted | 2026-10-02 |
| [008](./008-knowledge-base.md) | Decisions and notes live in `livenotes-documentation` (Markdown) | Accepted | 2026-10-02 |
| [009](./009-local-first-reads.md) | Always read the local copy; download it first if missing | Accepted | 2026-10-04 |
| [010](./010-manual-sync-staleness-check.md) | Sync only by button; project version check + "sync" toast | Accepted | 2026-10-04 |
| [011](./011-project-edit-mode.md) | One editor at a time per project (editing flag, inactivity expiry, server-enforced) | Accepted | 2026-10-04 |
| [012](./012-server-first-writes-local-patch.md) | Writes go to the server first, then patch the local copy | Accepted | 2026-10-04 |
| [013](./013-edit-controls-disabled-not-hidden.md) | Edit controls disabled (with a reason), not hidden | Accepted | 2026-10-04 |
| [014](./014-keep-local-data-on-logout.md) | Keep local data on logout; "Delete local data" in the user menu | Accepted | 2026-10-04 |
| [015](./015-pwa-update-banner.md) | PWA updates: closeable banner (hidden for a day), never auto-reload | Accepted | 2026-10-04 |
| [016](./016-offline-startup-remembered-user.md) | Offline startup uses the last signed-in user | Accepted | 2026-10-04 |
| [017](./017-offline-e2e-mocked-supabase.md) | Offline e2e tests against a mocked Supabase | Accepted | 2026-10-04 |
| [018](./018-npm-workspaces.md) | npm workspaces (not yarn) | Accepted | 2026-10-04 |
| [019](./019-e2e-credentials-outside-repo.md) | E2E credentials out of the repository; rotate leaked ones | Proposed | 2026-10-04 |
