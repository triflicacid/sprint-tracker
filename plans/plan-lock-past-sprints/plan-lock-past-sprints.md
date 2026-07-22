# Plan: past sprints are locked and cannot be edited

Status: **implemented**.

Goal: keep historical sprint data read-only once a sprint end date has passed.

## Current behavior

- Lock rule is shared in `shared/sprintLock.ts`:
  - `isSprintLocked({ endDate })` returns true when `endDate` is before today.
  - `SprintLockedError` is used for mutation rejection.
- Server-side enforcement is active and returns HTTP 409 for lock violations:
  - `server/services/sprintService.ts` blocks `updateSprint`.
  - `server/services/storyService.ts` blocks story creation and story-level updates for locked sprints.
  - `server/services/subtaskService.ts` blocks subtask creation and subtask updates for locked sprints.
  - `server/app.ts` maps `SprintLockedError` to `409`.
- Client-side controls are lock-aware and disable mutation actions in relevant pages/components.
- Lock icon is shown on detail pages when the parent sprint is locked.
- Holidays are still global in the data model, so lock behavior for holiday controls is UI-level only.

## Scope

- Date-derived lock only. No new lock/status columns are required for this behavior.
- No manual override in this plan.
- Locking applies to sprint, story, and subtask edits tied to a locked sprint.

## Design decisions

- **Boundary rule**: a sprint ending today stays editable until the next day; lock applies when
  `endDate < today`.
- **Enforcement layer**: service-level checks are the source of truth, with typed errors mapped to
  `409` for predictable API behavior.
- **UI behavior**: controls are disabled (not hidden) so users can see why an action is unavailable.
- **Comment edits**: sprint, story, and subtask comments follow the same lock rule as other edits.

## Validation points

- Mutating routes return `409` for locked sprints and continue to succeed for active sprints.
- Story and subtask detail pages prevent status and field edits when locked.
- Sprint detail page prevents adding stories and editing sprint fields when locked.
- Lock indicator is visible on sprint/story/subtask detail headers.

## Related follow-on

- Manual lock/unlock behavior is handled separately in
  `plans/plan-manual-lock-toggle/plan-manual-lock-toggle.md`.
