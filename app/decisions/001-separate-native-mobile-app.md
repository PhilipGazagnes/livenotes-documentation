# ADR-001: Web stays Vue; mobile is a separate React Native (Expo) app

- **Status:** Accepted
- **Date:** 2026-10-02
- **Supersedes:** the "Ionic/Capacitor hybrid" choice in [../tech-stack.md](../tech-stack.md)

## Context
- Long-term priority is the **iOS/Android app (phones and tablets)**. Community growth depends on top-quality apps: fluid, reliable, no "webby" jank, frictionless cross-platform.
- A web app is also required.
- The original plan was a single Vue + Ionic + Capacitor codebase for everything. No Capacitor build had been made yet (web/PWA only).
- The developer has no prior experience with Ionic/Capacitor or React Native.
- The project is early (~19k lines in `src/`), so a stack change is cheapest now.

## Decision
- **Web:** keep **Vue 3 + TypeScript + Tailwind + Pinia + Vite**. Don't migrate the web app to React (a rewrite with no real gain for web).
- **Mobile:** build a **separate React Native app with Expo**, MVP scope first.
- Share all non-UI code through a monorepo (ADR-002).

## Alternatives rejected
- **Ionic + Capacitor for mobile:** one codebase, but a WebView-based UI risks a "hybrid feel" on low-end Android. iOS also doesn't run service workers inside Capacitor, so the current offline approach would break there.
- **React (web) + Ionic/Capacitor:** same WebView runtime, so a rewrite for nothing.
- **React Native for web too (react-native-web):** web becomes second-class, and CodeMirror can't run in React Native.
- **Flutter:** full rewrite in Dart; web output is canvas-rendered, which is poor for a text-heavy app.
- **Separate Swift + Kotlin apps:** best quality, but three codebases is unrealistic for one developer.

## Consequences
- Two UI codebases: screens are written twice, everything else is shared.
- **Roles, not parity:** mobile = the performer's tool (setlists, songs, live view, flawless offline). Web = the management/editing tool (library curation, heavy SongCode editing, collaboration admin). Mobile catches up on editing later.
- Expect a React Native learning curve (builds, Xcode, store submission).

## Revisit if
- The React Native validation (see strategy, "React Native validation") shows jank or unbearable friction.
