# ADR-006: One SongCode editor (CodeMirror 6), embedded in a WebView on mobile

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
The V2 SongCode editor (syntax highlighting) is planned with CodeMirror 6, which only runs in a browser. React Native doesn't render through a browser, and building an equivalent native editor is a large, hard job.

## Decision
- Build the editor once, in `packages/editor`.
- **Web** uses it directly.
- **Mobile** bundles it into a **WebView used only for the editing screen**. Everything else stays native.
- The two sides communicate through a message bridge (text in, text and changes out). This is the same pattern Notion and Obsidian mobile use.

## Why
- Editing is not where jank shows; scrolling and viewing are, and those stay native.
- Write the editor once, maintain it once.
