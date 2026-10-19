# ADR-022: One error-handling convention in the web app

- **Status:** Accepted (implemented in livenotes-app, in production since 2026-10-19, #47)
- **Date:** 2026-10-19

## Context
Errors surfaced in several ways: thrown errors, `{ success, error }` results, `null` for a failed request, `executeOperation`, and toasts built by hand. The same refused write (`EditNotAllowedError`) read differently from one screen to the next. Worse, several actions showed a success toast after a failure: screens wrapped store results in `try/catch`, which never fires for a returned failure, and `executeOperation` showed its success toast before checking the result.

## Decision
The convention is written in `livenotes-app/docs/ERROR_HANDLING.md`:
- **Services throw** on any failure. They return `null` only for "not found" (`.maybeSingle()`), never for a failed request.
- **Stores return an `OperationResult`** (`{ success, data, error, cause }`), set their `error`, never throw and never show toasts. Exception: the edit-mode store explains disabled edit controls itself (ADR-013).
- **Screens** use `executeOperation`, or `orThrow()` in `try/catch` code, and one helper, `showErrorToast`, for the wording. A refused write shows its own message, the same on every screen.

## Why
- One layer, one job: a store doesn't know which screen called it, so it shouldn't choose the message.
- A result that has to be checked is easy to forget; `executeOperation` and `orThrow()` make the check part of the call.

## Consequences
- Stores and services follow it now. Screens that still build error toasts by hand are fixed when they are next touched (`livenotes-app/docs/TECHNICAL_DEBT.md`), not in one big refactor.
