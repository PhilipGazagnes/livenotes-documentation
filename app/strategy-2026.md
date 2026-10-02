# Livenotes Strategy & Roadmap (from 2026-10-02)

The plan agreed on 2026-10-02. Individual decisions and their reasoning are in [decisions/](./decisions/README.md); this file is the **order of work** and the open items.

## Goals
1. **Fix offline on web**: the biggest production problem.
2. **Top-quality native mobile apps (iOS/Android, phones and tablets)**: the long-term priority, built with an MVP mindset.
3. Keep the web app as the management and editing tool.

## Phases

### Phase 0: Monorepo move (~1 day)
- Move `livenotes-app` to `apps/web`, and create `packages/shared` (and later `packages/editor`). See [ADR-002](./decisions/002-monorepo.md).
- Yarn workspaces; CI, Netlify and e2e still work.

### Phase 1: Offline fix (a few days)
See [ADR-004](./decisions/004-offline-local-snapshot-dexie.md) and [ADR-005](./decisions/005-data-access-layer.md).
- Data layer in `packages/shared`, with a Dexie storage adapter.
- Sync downloads the raw project tables into IndexedDB; offline reads are local.
- Writes stay online-only and update the local copy after success.
- Sync errors are surfaced (no silent `.catch(() => null)`).
- Service worker cut down to app-shell caching only.
- Remove `useOfflineSync.warmUp()` and the Supabase route in `sw.ts`.

### Phase 2: Targeted cleanup
- Remove Ionic ([ADR-003](./decisions/003-remove-ionic-from-web.md)).
- One error-handling convention (see `livenotes-app/docs/TECHNICAL_DEBT.md`).
- **No standalone "refactor phase".** Other debt is fixed when the code is touched for a feature.

### Phase 3: Musician features on web (timeboxed)
- SongCode editing ([ADR-006](./decisions/006-shared-songcode-editor.md): build it as `packages/editor` so mobile reuses it), song views, song features.
- **Timebox to the core features.** Mobile is the long-term priority, and web growth must not delay it indefinitely.

### Phase 4: Mobile MVP (web on maintenance)
- Expo / React Native app in `apps/mobile` ([ADR-001](./decisions/001-separate-native-mobile-app.md)).
- **MVP scope = the performer's tool:** setlists, songs, live view, flawless offline, fast. Editing comes later, through the WebView editor.
- Local storage: SQLite (`expo-sqlite`) behind the shared data layer.
- Open: final split of features between web and mobile (to be decided by Philip).

## React Native validation (deferred, do before Phase 4 starts)
Skipped for now for lack of time; offline is fixed with Dexie, which doesn't depend on mobile. Before committing to Phase 4, run a ~1-week throwaway spike:
1. A minimal Expo app on the **dev** Supabase project, with ~1,000 seeded songs: song list, song detail, setlist view, plus CodeMirror in a WebView.
2. Test on **a cheap Android phone and an iPhone** (simulators hide performance problems).
3. Pass criteria:
   - smooth scrolling of 1,000 songs on the cheap Android phone
   - offline browsing with no errors
   - kill the app mid-sync, and it recovers
   - logging out and in as another user shows no leaked data
   - the WebView editor is acceptable
4. If it fails on feel or friction, reconsider ADR-001 before investing.

### Device testing setup (no publishing needed)
- **Expo Go:** scan a QR code from `npx expo start`. Fine for UI, but it lacks custom native modules.
- **Development build:** needed once native modules are involved.
  - **Android:** build an APK (EAS Build free tier, or locally) and install it directly. Free.
  - **iPhone:** with the **2020 MacBook Pro** + Xcode + a free Apple ID, `npx expo run:ios --device` over USB. The app expires after 7 days (rebuild to renew), and push notifications aren't available.
    - Check first: the chip (Intel or M1), and whether macOS runs the current Xcode.
    - **Apple Developer Program ($99/year)** is needed later for TestFlight and the App Store.
- Accounts to create (in Philip's name): Expo (free); Apple Developer when ready.

## Costs to expect
| Item | Now | At thousands of users |
|---|---|---|
| Supabase | Free (keepalive workaround) | Pro, ~$25/month |
| Offline (Dexie) | $0 | $0 |
| PowerSync (only if adopted later) | — | ~$49–80/month |
| Apple Developer | — | $99/year |
| Google Play | — | $25 one-time |
| GitHub Projects | $0 | $0 |

## Working agreements
- Project management: GitHub Issues + Projects ([ADR-007](./decisions/007-github-project-management.md)). Claude creates and maintains epics and issues via `gh`, and produces reports on request.
- Decisions: record every significant choice as an ADR in `decisions/` ([ADR-008](./decisions/008-knowledge-base.md)).
- Claude implements most tickets; Philip reviews, runs device builds, and handles store accounts and submissions.
