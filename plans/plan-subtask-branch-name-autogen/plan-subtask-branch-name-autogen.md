# Plan: auto-generate subtask branch name

Status: **implemented**.

Goal: auto-fill subtask branch name as `<category>/<jiraKey>-<slug>`, for example
`feature/NEB-1234-new-cash-payment-option`.

## Current state

- `branchName` is not set when a subtask is created in `server/services/subtaskService.ts`.
- `branch_name` defaults to `'(unknown)'` in `data/schema.sql`.
- Branch name is collected later during the `NEW -> WIP` transition, based on the `requires`
  config in `static/status_flow.json`.
- Required transition fields are rendered in `src/components/SubtaskRow.tsx` from `pendingFields`.
  All fields are currently rendered the same way, with no branch-name-specific prefill.

## Plan

- Add a client utility in `src/utils/branchName.ts`:
  ```ts
  export function generateBranchName(category: string, jiraKey: string | null, title: string): string
  ```
- Generator behavior:
  - Normalize `category` to lowercase kebab-case and keep `[a-z0-9-]`.
  - Convert `title` to slug: lowercase, whitespace to `-`, keep `[a-z0-9-]`, collapse repeated `-`, trim edge `-`.
  - Output `${category}/${jiraKey}-${slug}` when `jiraKey` exists.
  - Output `${category}/${slug}` when `jiraKey` is null.
- Expose story Jira key on each subtask from server responses:
  - In `server/services/subtaskService.ts`, join `stories` in `getSubtasksForStory` and `getSubtaskById`.
  - Select `stories.jira_key AS story_jira_key` and map to `storyJiraKey` in `rowToSubtask`.
  - Add `storyJiraKey: string | null` to `Subtask` in `shared/types.d.ts`.
  - Update `docs/api.yaml` `Subtask` schema.
- In `src/components/SubtaskRow.tsx`, during `startTransition(nextStatus)`, when required fields include
  `branchName`, seed `pendingFieldValues.branchName` with:
  `generateBranchName(subtask.type, subtask.storyJiraKey, subtask.title)`.
- For the `branchName` input only:
  - Add `autoFocus`.
  - Add `onFocus={(e) => e.target.select()}` so users can replace the generated value quickly.
  - Keep rendering for other required fields unchanged.

## Design decisions

- Include category prefix by default (`feature/`, `bugfix/`, `tech-debt/`, `spike/`).
- If `jiraKey` is null, use `<category>/<slug>`.
- Keep defensive sanitization for both category and title so generated names are git-safe.
- Do not add a max length in this pass.
- Seed once when the transition form opens. Do not re-generate while user edits.

## Suggested implementation steps

1. Add `generateBranchName` in `src/utils/branchName.ts`.
2. Add unit tests in `src/utils/branchName.test.ts` for:
   - category normalization
   - title slugging and punctuation stripping
   - null `jiraKey`
   - empty or whitespace-only title
   - repeated dash collapsing
3. Update server mapping and shared types:
   - `server/services/subtaskService.ts`
   - `shared/types.d.ts`
   - `docs/api.yaml`
4. Update transition prefill and select-on-focus behavior in `src/components/SubtaskRow.tsx`.
5. Add or extend a UI test for `SubtaskRow` that checks:
   - prefilled branch name on `NEW -> WIP`
   - user can overwrite the value normally
