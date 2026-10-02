# ADR-007: Project management in GitHub Issues + Projects

- **Status:** Accepted
- **Date:** 2026-10-02

## Decision
Use **GitHub Issues + GitHub Projects**:
- **Epics:** parent issues with sub-issues (built-in progress bar)
- **Tasks:** issues, with labels such as `web`, `mobile`, `shared`, `bug`
- **Sprints:** optional. An iteration field is available, but epics plus a prioritized backlog are enough solo.
- **Custom fields:** Priority, Size, Platform
- **Views:** board and timeline

Claude manages issues through the `gh` CLI (create epics and sub-issues, link PRs, auto-close on merge) and can generate custom reports from the GraphQL API: sprint and epic progress, burndown/velocity, web vs mobile balance, weekly digest, release readiness.

## Alternatives rejected
- **Linear:** best UX, but the free plan caps at 250 issues, which the first roadmap alone would roughly reach. Basic is ~$10/month. Reconsider if GitHub's UI becomes annoying.
- **Jira:** powerful but heavy for one person, and another place to keep in sync.

## Trade-offs accepted
- Basic native reporting (no burndown chart); covered by generated reports.
- A busier UI than Linear's.
- Issue *types* are org-only; labels are used instead.
