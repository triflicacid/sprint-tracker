# Plan: past sprints are locked and cannot be edited

Status: **waves 1-3 done** (2026-07-14) — `shared/sprintLock.ts` (`isSprintLocked` +
`SprintLockedError`), wired into `sprintService.updateSprint`, `storyService.createStory`/
`updateStoryAwaitingMoreSubtasks`/`updateStoryPoints`/`addTagToStory`/`removeTagFromStory`, and
`subtaskService.createSubtask`/`updateSubtask`, mapped to a 409 in `server/app.ts`'s error handler.
Client-side disabling (wave 3) and the lock icon are both in. Picked up from `docs/ideas.md`
("Past sprints are locked and cannot be edited").

**Wave 3 (2026-07-14): client-side disabling.** Every remaining mutating control on a locked
sprint/story/subtask now disables itself with a `title="this sprint has ended"` tooltip, matching
the pattern already established for holidays:
- `SprintDetailPage`: the "new story" button, and the sprint `CommentEditor`.
- `StoryDetailPage`: the `awaitingMoreSubtasks` checkbox, the story-points `RatingSelect`, tag
  add/remove, and the add-subtask form.
- `SubtaskRow` (used by both `StoryDetailPage`'s list and `SubtaskDetailPage`): gained a
  `sprintLocked` prop that makes the status-transition badges inert (no `onClick`, so
  `pendingStatus` can never be set — no separate guard needed on the confirm form) and disables the
  complexity `RatingSelect` alongside its existing `complexityLocked` check, combining both reasons
  in one `title`.
- `SubtaskDetailPage`: passes `sprintLocked` through to `SubtaskRow` and disables the subtask
  `CommentEditor`.
- `CommentEditor` (shared by sprint + subtask comments) gained `disabled`/`title` props — when
  disabled it drops the `-editable` class and click handler entirely rather than still opening the
  textarea, since neither call site previously wrapped its `onSave` in a try/catch (a locked save
  would have thrown unhandled).
- `StatusBadge` gained an optional `title` prop (needed to explain the disabled transition badges)
  — a small, generic, backward-compatible addition.

**Lock icon (2026-07-13)**: a padlock (`src/components/LockIcon.tsx`, green `#008300` to match the
"done" status lozenge — see `plans/sprint-lock-icon/`) now renders inline in the `<h1>` on
`SprintDetailPage`, `StoryDetailPage`, and `SubtaskDetailPage` whenever the relevant sprint is
locked. `StorySummary` was deliberately left untouched (no `sprintEndDate` there — it's used
broadly by `StoryCard`/stats and doesn't need lock info); instead `StoryDetail` alone gained
`sprintEndDate: string | null`, populated by `storyService.getStoryDetail` via a join on the
story's `sprint_id`. `SubtaskDetailPage` already fetches the parent `StoryDetail` for PDF-export
purposes, so it reuses that fetch rather than adding a new one. `h1 { display: flex; ... }` was
added once to `global.css` (all `h1` usages are single-line text, so this is a no-op everywhere
else) rather than duplicating flex/gap rules across three page-specific CSS files.

**Consolidated (2026-07-13)**: `isSprintLocked` originally existed as two near-identical copies —
`server/services/sprintLockService.ts` (with `SprintLockedError`) and `src/utils/sprintLock.ts`
(client-only, added for the holiday fix below). Both were deleted and replaced by a single
`shared/sprintLock.ts` exporting both `isSprintLocked` and `SprintLockedError`, following the same
server/client-shared pattern as `shared/statusCatalog.ts`/`shared/statusHistory.ts` (server imports
via `../../shared/sprintLock.js`, client via the `@shared/sprintLock` alias). `SprintLockedError`
now lives in shared too even though only the server throws/catches it — it has no
Node/DOM-specific dependencies, and keeping it next to `isSprintLocked` avoids a second file.

**Bug found and fixed along the way**: `server/app.ts`'s error-handling middleware was declared
with only 3 parameters (`error, _req, res`) instead of the 4 Express requires (`error, req, res,
next`) to be recognized as error-handling middleware at all — confirmed via a minimal repro that
thrown errors were never reaching it; Express's own default handler was responding instead (a
generic HTML page, not the intended JSON). Fixed by adding the unused `next` param (with an
eslint-disable for the resulting unused-var warning), which was a prerequisite for the 409 mapping
to work at all.

**Test fixture fallout**: `server/tests/integration/stats.test.ts`'s fixture sprint used a
hardcoded `endDate: "2026-01-10"`, already in the past — the new lock enforcement broke 2 of its
tests. Fixed by computing the fixture's end date relative to "now" instead of hardcoding it.
`src/tests/integration/SprintDetailPage.test.tsx` had the same issue (`endDate: "2026-01-15"`),
found when adding the holiday fix below; fixed the same way.

**Follow-up (2026-07-13): holidays on a locked sprint's page.** Reported as a bug: on a locked
sprint's detail page, add/remove-holiday still worked. Root cause: `holidays` is a global table
with no `sprint_id` (`data/schema.sql:53-55`), and `POST`/`DELETE /api/holidays[/:date]`
(`server/routes/holidays.ts:13,23`) have no sprint context at all — this was already flagged as
out of scope in this doc's "Current state" section, deferring instead to the separate
`docs/ideas.md:13` item ("remove the add/remove-holiday UI from the sprint page entirely, replace
with a popup calendar elsewhere"). Given a choice between the two, went with the narrower fix:
`isSprintLocked` (now `shared/sprintLock.ts` — see consolidation note above) now disables the
add/remove-holiday controls on `SprintDetailPage` when the viewed sprint is locked, with a `title`
tooltip ("this sprint has ended") matching the existing `complexityLocked` pattern in
`SubtaskRow.tsx`. Client-side only — no server enforcement, since holidays still aren't
sprint-scoped in the data model. The bigger
`docs/ideas.md` item (remove the UI, add a popup calendar) is still open and unstarted.

## Current state

There is no "past sprint" concept anywhere today — no `locked`/`status`/`is_active` column on
`sprints` (`data/schema.sql:3-10`), no `isPast`/`isCurrent` helper in `src/` or `server/`, and no
mutation-guard middleware anywhere in `server/app.ts` (it only wires `cors()`, `express.json()`,
and an error handler). Every mutating route runs unconditionally regardless of how old its sprint
is:

- `PATCH /api/sprints/:id` — name/dates/comment (`server/routes/sprints.ts:30`,
  `sprintService.ts:91`) — only the comment is actually editable in the UI today
  (`SprintDetailPage.tsx:55-58`), but the service accepts all fields.
- `POST /api/sprints/:id/stories` — add story (`sprints.ts:38`).
- `PATCH /api/stories/:id` — `awaitingMoreSubtasks`/`storyPoints` (`stories.ts:19`).
- `POST /api/stories/:id/subtasks` — add subtask (`stories.ts:39`).
- `POST` / `DELETE /api/stories/:id/tags[/:tagId]` — story tags (`stories.ts:54,66`).
- `PATCH /api/subtasks/:id` — the one generic subtask endpoint: status transitions, branch name,
  comment, complexity rating, release version, PR url (`subtasks.ts:22`, `subtaskService.ts:81`).

Holidays (`POST`/`DELETE /api/holidays`) are **global**, not sprint-scoped
(`server/routes/holidays.ts:12,22`) — out of scope here, already its own idea
("Remove ability to add/remove holidays on a sprint's state page...").

`end_date` already exists and is nullable (`sprints.end_date`); the only thing that currently
populates it automatically is `createSprint` backfilling the *previous* sprint's `end_date` with
the new sprint's `start_date` if it was null (`sprintService.ts:52-62`) — so in practice every
sprint except the latest already has an end date, and the latest has `endDate: null` ("to
present" in `SprintCard.tsx:12-14`).

## Plan

- **No new schema column.** Derive "past" from `end_date` instead of adding a `locked`/`status`
  field: a sprint is locked once `end_date` is non-null and has passed. This avoids the one-off
  manual `ALTER TABLE` + real-db-edit dance that schema changes require in this project (no
  migration framework — see `docs/context.md`'s "Full backend map" section) and means every
  existing historic sprint is correctly locked the moment this ships, with zero backfill.
- **Shared helper**, e.g. `server/services/sprintLockService.ts`:
  ```ts
  export function isSprintLocked(sprint: { endDate: string | null }): boolean
  ```
  Compares `endDate` against `new Date().toISOString().slice(0, 10)` as plain ISO date strings
  (lexical `<` comparison), matching the existing idiom already used for date-string comparisons
  in `statsService.ts` (e.g. line 321) rather than constructing `Date` objects and risking a
  timezone-driven off-by-one.
- **Enforce at the service layer**, not just the route layer, so there's exactly one place per
  service to check (mirrors how `updateSubtask` already centralizes transition validation via
  `statusFlowService.ts`):
  - `sprintService.updateSprint` — reject if the *target* sprint is locked. (Open question below:
    should this apply to the comment field too?)
  - `storyService.createStory`, `updateStory`, tag add/remove — reject if the parent sprint (via
    `sprint_id`) is locked.
  - `subtaskService.createSubtask`, `updateSubtask` — reject if the sprint reached by
    `subtask → story → sprint_id` is locked. `updateSubtask` already loads the subtask row before
    applying changes, so the extra join/lookup is small.
  - All rejections throw a typed error (e.g. `SprintLockedError`) that `server/app.ts`'s existing
    error handler maps to a `409` (not `400`/`500`), so the client can distinguish "this sprint is
    locked" from a validation failure.
- **Client-side**: disable rather than hide the affected controls when the loaded sprint/story's
  sprint is locked (add-story/add-subtask buttons, the subtask transition form, story-points
  select, tag add/remove) with a short inline explanation ("this sprint has ended"), instead of a
  silent 409 the user doesn't understand. `SprintDetailPage`/`StoryDetailPage`/`SubtaskRow` all
  already load their sprint/story data, so `isSprintLocked` can run client-side too (same date-
  string comparison, no extra fetch) to drive this without waiting on a failed request.

## Design decisions (resolved 2026-07-12)

- **Unlock/override escape hatch: no.** A pure date-derived lock means a genuine data-entry
  correction (fixing a typo on a sprint that ended yesterday) is only possible by directly editing
  the sqlite file. Decided **not** to build an override in this first pass — matches "past sprints
  are locked" literally. This is the main real-world friction point to watch for; if it turns out
  to be needed, adding one later is additive (an explicit `force`/admin-only flag), not a redesign.
- **Comment field: locked too.** The comment is the *only* sprint-level field actually editable in
  the UI today. Locking it matches the literal reading of "cannot be edited" — a comment fixed
  after the fact is rare enough to fall under the same "no override" answer above.
  Consistency also to note: locking blocks new tags, but not their absence — nothing else to weigh
  there.
- **Boundary date: locks the day after `end_date`.** "Past" is defined as `end_date` strictly
  before today, i.e. a sprint ending *today* is still editable until the day rolls over — its last
  day is still plausibly in progress.
- **Why service-layer over DB triggers/constraints**: sqlite `CHECK`/triggers could enforce this at
  the DB layer too, but would duplicate the "is locked" date logic in SQL and produce an opaque
  DB-level error instead of a typed, catchable one — service-layer enforcement keeps the logic in
  one place (TypeScript) and the error shape consistent with the rest of the API.

## Suggested implementation steps (when picked up)

Can be landed in three independently-shippable waves:

- **Wave 1 — pure helper, no wiring** (steps 1-2): zero behavior change, safe to merge any time.
- **Wave 2 — backend enforcement** (steps 3-4): mutations on locked sprints actually start getting
  rejected (409). Tradeoff: if shipped without wave 3, the UI has no explanation for the 409 yet —
  acceptable as a short-lived gap, but worth knowing before committing to this order.
- **Wave 3 — client UX** (steps 5-6): disables controls and explains the lock inline instead of a
  bare failed request.

1. Re-verify the file/line references above still hold — written from a point-in-time read of the
   codebase (2026-07-08). *(wave 1)*
2. Add `isSprintLocked` + a `SprintLockedError` to a new `server/services/sprintLockService.ts`,
   with a unit test covering: null `endDate` (never locked), `endDate` in the past (locked),
   `endDate` today (not locked — see boundary decision above), `endDate` in the future (not
   locked). *(wave 1)*
3. Wire the check into `sprintService.updateSprint`, `storyService.createStory`/`updateStory`/tag
   add+remove, `subtaskService.createSubtask`/`updateSubtask` — each resolving the relevant
   sprint's `end_date` first (subtasks/stories need the join up to `sprints`). *(wave 2)*
4. Map `SprintLockedError` to a `409` in `server/app.ts`'s error handler. *(wave 2)*
5. Add a client-side `isSprintLocked` check (or reuse the same date-string comparison inline) in
   `SprintDetailPage`, `StoryDetailPage`, `SubtaskRow` to disable the relevant controls and show an
   inline "this sprint has ended" note, rather than relying on the 409 alone. *(wave 3)*
6. Integration tests: attempt each mutating route (add story, add subtask, transition subtask,
   update story points, add/remove tag, update sprint) against a sprint with a past `end_date` and
   assert `409`; assert the same routes still succeed against a sprint with `endDate: null` or a
   future `endDate`. *(wave 3, though can be written alongside wave 2)*
