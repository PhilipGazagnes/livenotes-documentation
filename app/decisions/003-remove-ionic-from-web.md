# ADR-003: Remove Ionic and Capacitor from the web app

- **Status:** Accepted (not started)
- **Date:** 2026-10-02

## Context
Ionic/Capacitor were there to turn the web app into a mobile app. React Native now takes over that job (ADR-001).

Usage at decision time is light: 13 files. Mostly `<ion-page>` / `<ion-content>` wrappers on 10 pages, plus a single modal, spinner, toolbar, icon and button. The UI itself is Tailwind.

## Decision
- Remove `@ionic/vue`, and replace `@ionic/vue-router` with plain `vue-router`.
- Capacitor is never added to the web app.

## Why
- Less weight, and no forced "mobile app" look on desktop.
- Ionic's page-stack navigation is behind some history/back-button quirks (see the drawer/popstate issue).

## How
- One ticket in the web cleanup epic, ~1 day. Re-run the e2e suite afterwards.
- Not urgent: do it around the monorepo move, not before the offline fix.
