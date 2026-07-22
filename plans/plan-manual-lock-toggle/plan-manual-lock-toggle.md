# Plan: manual lock toggle for stories and subtasks

Status: **not started**.

Goal: add a user-controlled lock toggle for stories and subtasks, while preserving the existing
sprint-end lock behavior.

## Current state

- The app already enforces date-based sprint locks via `shared/sprintLock.ts` (`isSprintLocked` and
  `SprintLockedError`).
- Story and subtask records do not have a persisted manual lock flag in `data/schema.sql`.
- Shared API types in `shared/types.d.ts` do not include a `locked` field on stories or subtasks.
- `server/app.ts` maps `SprintLockedError` to `409`, but there is no error type for manual lock
  violations.
- `src/components/LockIcon.tsx` is display-only and has no interactive toggle behavior.

## Scope

- Add manual lock flags for both stories and subtasks.
- A story lock cascades to all of its subtasks at runtime.
- A subtask can be locked independently even when its story is unlocked.
- Sprint-end lock remains absolute and unchanged.

## Data model

- Add `locked INTEGER NOT NULL DEFAULT 0` to:
  - `stories`
  - `subtasks`
- Update `data/schema.sql`.
- Existing local databases can be reset/reseeded during development as needed.

## Lock semantics

- Story effective lock: `isSprintLocked(sprint) || story.locked`.
- Subtask effective lock: `isSprintLocked(sprint) || story.locked || subtask.locked`.
- Turning lock **on** is rejected if the sprint has already ended.
- Turning lock **off** is always allowed (it only changes manual flags, not sprint-end lock).

## API and backend plan

1. Add shared helpers in `shared/sprintLock.ts`:
   - `ManualLockError`
   - `isEffectivelyLocked(...)` helper(s) for story/subtask checks
2. Extend server error handling in `server/app.ts`:
   - map `ManualLockError` to `409`
3. Extend story persistence and service behavior in `server/services/storyService.ts`:
   - include `locked` in row mapping and returned story payloads
   - enforce effective-lock checks in story mutations
   - add `setStoryLocked(storyId: number, locked: boolean)`
4. Extend subtask persistence and service behavior in `server/services/subtaskService.ts`:
   - include `locked` in row mapping and returned subtask payloads
   - enforce story+subtask effective-lock checks in subtask mutations
   - add `setSubtaskLocked(subtaskId: number, locked: boolean)`
5. Add dedicated lock routes:
   - `PATCH /api/stories/:id/lock` with `{ locked: boolean }`
   - `PATCH /api/subtasks/:id/lock` with `{ locked: boolean }`

## Shared types and API client

- Add `locked: boolean` to:
  - `StorySummary` (and inherited `StoryDetail`)
  - `Subtask`
- Add API client helpers in `src/api/client.ts`:
  - `setStoryLocked(id, locked)`
  - `setSubtaskLocked(id, locked)`

## Frontend plan

1. Extend `src/components/LockIcon.tsx`:
   - support `open` state (unlocked visual)
   - support optional click handler for toggle use-cases
   - keep current non-interactive usage backward-compatible
2. Wire story lock toggle in `src/pages/StoryDetailPage.tsx`:
   - allow toggle only when sprint is not date-locked
   - refresh story data after toggle
   - pass `storyLocked` to subtask rows for cascade behavior
3. Update `src/components/subtasks/SubtaskRow.tsx`:
   - accept `storyLocked` prop
   - merge `sprintLocked`, `storyLocked`, `subtask.locked`, and existing complexity lock rules
   - render subtask lock toggle as interactive only when allowed
4. Update `src/pages/SubtaskDetailPage.tsx` similarly for standalone subtask view.

## Tests

- `server/services/storyService.test.ts`:
  - story mutations fail with `ManualLockError` when story is manually locked
  - `setStoryLocked` lock/unlock behavior
  - lock-on rejected for ended sprint
- `server/services/subtaskService.test.ts`:
  - subtask mutations fail for story lock cascade and for subtask own lock
  - `setSubtaskLocked` lock/unlock behavior
  - lock-on rejected for ended sprint
- Route/integration coverage:
  - lock endpoints return `409` when lock-on is attempted for ended sprint
  - lock endpoints succeed for valid toggle operations

## Verification

- Locking a story immediately disables mutation controls for that story and all of its subtasks.
- Locking one subtask affects only that subtask when story is unlocked.
- Unlocking manual flags re-enables controls unless sprint-end lock still applies.
- API responses clearly distinguish manual-lock failures from sprint-end failures.
