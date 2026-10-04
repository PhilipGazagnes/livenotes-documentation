# ADR-013: Edit controls are disabled, not hidden, when editing isn't possible

- **Status:** Accepted (not implemented yet)
- **Date:** 2026-10-04
- **Supersedes:** the Phase 1 implementation detail "offline, `isEditor` is false, which hides all edit controls"

## Decision
- Edit controls stay **visible but disabled (greyed out)** when the user has the right role but can't edit right now.
- Reasons, each with an explanation when the control is tapped (toast or hint):
  - offline: "Editing needs a connection";
  - not in edit mode: "Start editing first" ([ADR-011](./011-project-edit-mode.md));
  - someone else holds the flag: "Being edited by <name>";
  - local copy outdated: "Sync first" ([ADR-010](./010-manual-sync-staleness-check.md)).
- Members whose role can't edit (viewers) still don't see edit controls.
- Implementation: separate "role allows editing" from "editing is possible now" instead of one `isEditor` flag.

## Why
Hidden controls make the interface jump and leave users wondering where a feature went. Disabled controls with a reason explain what to do.
