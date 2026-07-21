# Plan: manual lock toggle for stories and subtasks

Status: **not started** (2026-07-14) — design only so far, picked up from a follow-up question on
`plans/plan-lock-past-sprints/plan-lock-past-sprints.md`'s lock icon work.

## Context

`plans/plan-lock-past-sprints/` shipped a read-only lock derived purely from a sprint's `end_date`
— deliberately with **no override**, since it's a plain date-driven fact (see that doc's "Design
decisions" section: "Unlock/override escape hatch: no"). `src/components/LockIcon.tsx` currently
just displays that state; it has no click handler.

This plan is for a second, independent lock: a manual toggle on individual stories/subtasks that a
user can flip on or off at will (e.g. "freeze this story even though its sprint hasn't ended yet").
Unlike the sprint-end lock, this one is meant to be reversible, so it gets its own persisted flag,
its own error type, and its own toggle UI — layered on top of, never replacing, the existing
sprint-end check.

**Resolved with the user (2026-07-14):** locking a story cascades to lock all of its subtasks too
(mirrors how the sprint-end lock already cascades sprint → story → subtask). Subtasks also get their
own independent lock flag, for freezing one subtask without locking the whole story.

## Design decisions

- **Two new columns**, `stories.locked` / `subtasks.locked` (`INTEGER NOT NULL DEFAULT 0`). No
  migration framework exists (`data/schema.sql` uses `CREATE TABLE IF NOT EXISTS`, a no-op against
  an already-existing table — confirmed via full git-history grep, no `ALTER TABLE` precedent
  anywhere in this repo). So: add the columns to `schema.sql` (fresh installs) **and** a new one-off
  `data/add-locked-columns.sql` with the two `ALTER TABLE ... ADD COLUMN` statements, run via the
  existing `pnpm run db:run-sql add-locked-columns.sql` mechanism (same pattern as
  `db:load:test`/`db:load:historical` in `package.json`). That command mutates the real local
  `data/sprint-tracker.sqlite3` — run it deliberately, not as a side effect of another step. The
  test suite is unaffected (rebuilds from `schema.sql` via `initSchema()` on a separate `DB_PATH`).
- **"Effectively locked"** = `isSprintLocked(sprint) OR story.locked` for story/subtask mutations
  gated at the story level, or `... OR story.locked OR subtask.locked` for subtask mutations (the
  cascade). New shared predicate `isEffectivelyLocked` plus a new `ManualLockError` class, both
  added to `shared/sprintLock.ts` (already the shared home for `isSprintLocked`/`SprintLockedError`,
  imported by both services and the client).
- **New error class, not a reused `SprintLockedError`**: "this sprint has ended" and "this was
  manually locked" are different facts the user needs distinguished, matching this codebase's
  existing one-class-per-fact convention (`SprintLockedError`, `SubtaskUpdateError`). Extend
  `server/app.ts`'s error middleware with one more `instanceof` branch → still maps to 409.
- **Dedicated toggle routes**, not a field on the generic PATCH: `PATCH /api/stories/:id/lock` and
  `PATCH /api/subtasks/:id/lock`, body `{ locked: boolean }`. Locking is an administrative action
  distinct from content edits — matches the existing precedent of tags getting their own sub-resource
  routes (`POST`/`DELETE /api/stories/:id/tags[/:tagId]`) rather than being folded into
  `PATCH /:id`. Turning a lock **on** is rejected (`ManualLockError`) if the item's sprint has
  already ended (redundant/confusing otherwise); turning it **off** is always allowed, including
  when the sprint itself is locked (harmless no-op on the *effective* lock, but keeps the manual
  flag meaningful independent of the sprint's fate). These toggle routes do **not** run the
  cascade/effective-lock check on themselves — only the sprint-only guard on lock-on — so a
  subtask's own lock stays toggleable even while its parent story is separately locked.
- **`LockIcon.tsx` gets two new optional props**, not a new component: `open?: boolean` (renders an
  open-shackle path) and `onClick?: () => void` (wraps the svg in a reset-styled `<button>`; absent
  = today's exact non-interactive behavior, so the sprint-end-locked call sites need zero changes).
  Three states per item: sprint-locked → today's icon, unchanged; unlocked+toggleable → open icon,
  click to lock; manually-locked+toggleable → closed icon, click to unlock.

## Implementation steps

**Docs**
0. This file — keep its Status line updated as waves land, matching the convention in
   `plans/plan-lock-past-sprints/plan-lock-past-sprints.md`.

**Backend**
1. `data/schema.sql` — add `locked INTEGER NOT NULL DEFAULT 0` to `stories` and `subtasks`.
2. `data/add-locked-columns.sql` (new) — the two `ALTER TABLE` statements; run manually via
   `pnpm run db:run-sql add-locked-columns.sql` against the real dev db.
3. `shared/sprintLock.ts` — add `ManualLockError` and `isEffectivelyLocked(sprint, manuallyLocked)`.
4. `server/services/storyService.ts` — `locked` on `StoryRow`/summary mapping; extend
   `assertStorySprintUnlocked`'s join to select `stories.locked`; new
   `setStoryLocked(storyId, locked)` (sprint-only guard on lock-on).
5. `server/services/subtaskService.ts` — `locked` on `SubtaskRow`/mapping; extend
   `assertStorySprintUnlocked`'s join to also select `stories.locked` (cascade) plus a check on the
   subtask's own `locked`; new `setSubtaskLocked(subtaskId, locked)` (sprint-only guard on lock-on).
6. `server/routes/stories.ts` — `PATCH /:id/lock`.
7. `server/routes/subtasks.ts` — `PATCH /:id/lock` (catch `SubtaskUpdateError` locally, matching the
   existing `PATCH /:id`; rethrow everything else to the app-level 409 handler).
8. `server/app.ts` — add `ManualLockError` to the `instanceof` check.

**Shared types**
9. `shared/types.d.ts` — add `locked: boolean` to `Subtask` and `StorySummary` (`StoryDetail`
   inherits it).

**Frontend**
10. `src/api/client.ts` — `setStoryLocked(id, locked)`, `setSubtaskLocked(id, locked)`.
11. `src/components/LockIcon.tsx` + `LockIcon.css` — `open`/`onClick` props, open-shackle path,
    `.lock-icon-button` reset style (cribbed from `.tag-remove` in `story-tags.css`).
12. `src/pages/StoryDetailPage.tsx` — render the toggleable icon when `!sprintLocked`, add a toggle
    handler (follow the existing `handleAwaitingMoreSubtasksChange`-style await-then-`loadStory()`
    pattern), pass `storyLocked={story.locked}` down to each `SubtaskRow`.
13. `src/components/subtasks/SubtaskRow.tsx` — new `storyLocked?: boolean` prop, fold into existing
    `disabled`/`title` logic alongside `sprintLocked`/`complexityLocked`; render the subtask's own
    toggle icon (three-state rule cascaded one level down: inert if `sprintLocked || storyLocked`).
14. `src/pages/SubtaskDetailPage.tsx` — same wiring for the subtask's own lock, using its already-
    fetched parent `story` for the cascade check.

**Tests** (mirroring `insertStoryInLockedSprint`/`toThrow(SprintLockedError)` in
`storyService.test.ts` / `subtaskService.test.ts`)
15. `storyService.test.ts` — `insertManuallyLockedStory()` helper; per mutating function, a
    "throws ManualLockError when manually locked" case; new `describe("setStoryLocked", ...)`
    covering lock/unlock happy paths and "throws when sprint has already ended".
16. `subtaskService.test.ts` — `insertSubtaskUnderLockedStory()` (cascade) and
    `insertManuallyLockedSubtask()` helpers; per mutating function, cascade + own-lock throw cases,
    plus a "does not persist" case mirroring the existing sprint-lock test; new
    `describe("setSubtaskLocked", ...)` mirroring the story version, including confirming a
    subtask's own lock stays toggleable while its story is separately locked.

## Verification

- Run the service test suites for the new/extended cases above.
- Manually in the browser: lock a story on an open sprint, confirm its subtasks' edit controls and
  status badges go inert and the lock icon flips to "manually locked"; unlock it and confirm they
  re-enable. Lock a single subtask without locking its story, confirm only that subtask is affected.
  Confirm the toggle icon doesn't appear as clickable on an already sprint-locked item, and that
  attempting to lock a story/subtask whose sprint has ended is rejected.
