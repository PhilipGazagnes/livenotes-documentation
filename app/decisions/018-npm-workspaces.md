# ADR-018: npm workspaces (not yarn)

- **Status:** Accepted (implemented on `feat/monorepo-offline`)
- **Date:** 2026-10-04
- **Supersedes:** the "yarn workspaces" tooling choice in [ADR-002](./002-monorepo.md) (the monorepo layout itself stands)

## Context
ADR-002 assumed yarn because `package.json` had a yarn `packageManager` field. In practice the project used npm: `package-lock.json` was the tracked lockfile, the README said npm, and Netlify builds with `npm run build`. The yarn field was stray.

## Decision
- The monorepo uses **npm workspaces** (`apps/*`, `packages/*`), one `package-lock.json` at the root.
- Add a dependency to one workspace with `npm install <pkg> -w @livenotes/web` (or `-w @livenotes/shared`).
- Turborepo only if builds get slow (unchanged from ADR-002).
