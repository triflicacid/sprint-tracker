# Plan: auto-generate subtask branch name

Status: **not started** — plan/exploration only, no code yet. Picked up from: "Auto-generate
subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g.,
`tech-debt/NEB-1234-my-title-here` (this is autofilled in the textbox and highlighted, so can be
replaced by the user)".

## Current state

`branchName` isn't collected at subtask creation (`createSubtask` — `subtaskService.ts:68-76` —
always starts a new subtask as `status = 'NEW'` with no branch name at all;
`branch_name` defaults to `'(unknown)'` in the schema, `data/schema.sql:31`). It's collected later,
the first time a subtask transitions `NEW → WIP` — `static/statusFlow.json`'s one `requires` entry
for that transition (`{"field": "branchName", "label": "Branch name", "type": "text", "column":
"subtasks.branch_name"}`).

That field is rendered generically in `SubtaskRow.tsx`'s pending-transition form
(`SubtaskRow.tsx:124-142`): `pendingFields.map(...)` renders one plain `<input>` per required
`FlowField`, value controlled by `pendingFieldValues[field.field]`, starting blank
(`setPendingFieldValues({})` in `startTransition`, `SubtaskRow.tsx:41-44`). There is currently no
per-field special-casing at all — every `FlowField` (branch name, PR url, release version) is
rendered identically. This is the natural hook point: special-case only when
`field.field === "branchName"`, prefill+highlight it, leave every other field's generic rendering
untouched.

**The `tech-debt/` prefix in the request's example depends on a feature that doesn't exist yet.**
`docs/ideas.md`'s very next line up is "A subtask can be of a given type - feature, bugfix,
tech-debt, spike" — tracked separately as `plans/subtask-type-icons/subtask-type-icons.md`
("not started"). There is no `type`/`subtasks.type` column today, so there is nothing to generate
that prefix segment *from* yet. See "Design decisions to flag" below — this plan ships the
`{jiraKey}-{slug}` part now and treats the type-prefix as a follow-on once that sibling plan lands.

## Plan

- **Slug generator**: a new pure client-side utility, e.g. `src/utils/branchName.ts`:
  ```ts
  export function generateBranchName(jiraKey: string | null, title: string): string
  ```
  Lowercases `title`, replaces whitespace runs with `-`, strips characters git branch names
  disallow/that would look wrong in a slug (keep `[a-z0-9-]` only after lowercasing), collapses
  repeated `-`, trims leading/trailing `-`. Prefixes with `${jiraKey}-` when `jiraKey` is non-null,
  otherwise just the slug alone (see "no jiraKey" below).
- **Source the story's jira key onto `Subtask` itself**, via a join, rather than prop-drilling or an
  extra fetch: `getSubtasksForStory`/`getSubtaskById` (`subtaskService.ts`) join `stories` and select
  `stories.jira_key AS story_jira_key`; `rowToSubtask` maps it to a new `storyJiraKey: string | null`
  field; add the same field to the `Subtask` interface in `shared/types.d.ts`. Chosen over passing a
  prop down from the parent page because **`SubtaskDetailPage.tsx` doesn't currently fetch the parent
  story at all** (`loadSubtask()` only calls `api.getSubtask`/`api.getSubtaskHistory`,
  `SubtaskDetailPage.tsx:21-32`) — putting it on `Subtask` avoids adding a second network round trip
  there, and keeps `SubtaskRow`'s prop signature unchanged at both call sites (`StoryDetailPage.tsx`
  already has `story.jiraKey` in scope but would otherwise need a new prop just for this).
- **`SubtaskRow.tsx`**: in `startTransition(nextStatus)`, when the transition's required fields
  include `branchName` (`requiredFields(subtask.status, nextStatus)`), seed
  `pendingFieldValues.branchName` with `generateBranchName(subtask.storyJiraKey, subtask.title)`
  instead of leaving `pendingFieldValues` empty.
- **Autofill + highlight**: the `branchName` input specifically (not the generic per-field map for
  every other field) gets `autoFocus` and `onFocus={(e) => e.target.select()}` — selects the
  generated text on mount so the user can either accept it as-is or start typing to overwrite it
  entirely, matching "autofilled ... and highlighted, so can be replaced by the user" literally.
  Keep every other `FlowField` type's rendering exactly as it is today (PR url, release version stay
  plain, no autofill).

## Design decisions to flag

- **Type prefix (`tech-debt/`) — not included in this pass.** Recommend shipping
  `{jiraKey}-{slug}` now (e.g. `NEB-1234-my-title-here`) and revisiting once
  `plans/subtask-type-icons/subtask-type-icons.md` actually lands a `subtasks.type` field — at that
  point `generateBranchName` gains an optional `typeShortName` param and prepends `${typeShortName}/`
  when present. Shipping the two together isn't necessary — this feature works, and produces a
  sensible branch name, with or without a type prefix; blocking on the sibling plan would hold up a
  small, independently useful change for an unrelated, larger one.
- **No `jiraKey`**: some stories' `jiraKey` is `null` (only regex-extracted when the Jira URL matches
  the expected pattern — `storyService.ts`'s `extractJiraKey`). Recommend falling back to the slug
  alone (`my-title-here`) rather than blocking the feature or inventing a placeholder like `NOKEY-`.
- **Sanitizing beyond "lowercase + spaces→dashes"**: the request's literal spec only mentions those
  two transforms, but subtask titles are free text and could contain characters git branch names
  reject outright (`~^:?*[\`, consecutive `..`, etc.) or that would just look wrong in a slug
  (punctuation, emoji). Recommend stripping anything outside `[a-z0-9-]` after the lowercase/dash
  pass, purely defensive — a title with no unusual characters produces byte-identical output to the
  literal spec either way, so this doesn't change the common case, just guards the uncommon one.
- **No length cap.** A very long title produces a very long branch name. Not capping it for a first
  pass — git itself has no practical length limit worth defending against here, and the field is
  freely editable/highlighted for the user to shorten if they want to. Flag as a place to add a cap
  later if long generated names turn out to be annoying in practice.
- **Only pre-fills on first render of the pending form**, not live as the user types over it —
  `pendingFieldValues.branchName` is seeded once in `startTransition`, then behaves as an ordinary
  controlled input after that (no re-generation while the transition form is open, even if
  `subtask.title` were somehow edited concurrently, which the UI doesn't support mid-transition
  anyway). This is the same one-shot-seed behavior "autofilled ... so can be replaced" implies, not
  meant to keep regenerating.

## Suggested implementation steps (when picked up)

1. Re-verify the file/line references above still hold — written from a point-in-time read of the
   codebase (2026-07-08).
2. Add `generateBranchName` to `src/utils/branchName.ts` + a unit test file `branchName.test.ts`
   (lowercase/dash cases, punctuation stripping, null `jiraKey`, empty/whitespace-only title edge
   case, repeated-dash collapsing).
3. Add the `stories` join + `storyJiraKey` to `subtaskService.ts`'s `getSubtasksForStory`/
   `getSubtaskById`/`rowToSubtask`, and the field to `Subtask` in `shared/types.d.ts`. Update
   `docs/api.yaml`'s `Subtask` schema entry to match.
4. Wire the seed + `autoFocus`/`onFocus`-select behavior into `SubtaskRow.tsx`'s `startTransition`
   and the `branchName` input specifically.
5. Add/extend a test: a `SubtaskRow.test.tsx` (or equivalent) case asserting the branch-name input is
   pre-populated with the generated value when starting a `NEW → WIP` transition, and that typing
   over it still updates `pendingFieldValues` normally (i.e. it's a real controlled input, not
   read-only).
