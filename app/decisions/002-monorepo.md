# ADR-002: Monorepo

- **Status:** Partly superseded: the tooling (yarn) is replaced by npm workspaces, see [ADR-018](./018-npm-workspaces.md). The layout stands.
- **Date:** 2026-10-02

## Decision
Turn `livenotes-app` into a monorepo:

```
livenotes/
├── apps/
│   ├── web/          ← current Vue app, moved as-is
│   └── mobile/       ← Expo / React Native app (later)
├── packages/
│   ├── shared/       ← types, services, validation, constants, data layer (ADR-005)
│   └── editor/       ← SongCode CodeMirror editor (ADR-006)
└── supabase/         ← migrations, edge functions (one backend for both apps)
```

- Tooling: **yarn workspaces** to start (the project already uses yarn). Add Turborepo only if builds get slow.
- `@livenotes/songcode-converter` stays a separate published npm package for now. Move it into `packages/` if it starts changing often.

## Why
- Writes non-UI logic once for both apps.
- One repo for the backend schema shared by both apps.
- Low migration cost: the current repo becomes `apps/web` almost unchanged. Code is extracted into `packages/shared` progressively, not all at once.

## Order
Done **first** (step 0, ~1 day), so the offline fix (ADR-004) is written directly in `packages/shared`.
