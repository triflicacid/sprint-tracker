# Plan design and refinement

This document defines how ideas, plans, and plan summaries are written and maintained in this repo.

## Purpose

- Keep `docs/ideas.md` as an ideas-only backlog.
- Convert selected ideas into implementation-ready plans under `plans/`.
- Keep each plan current, concise, and aligned with the actual codebase.
- Keep `plans/summary.md` as the quick index of current plan status.

## Source of truth

- `docs/ideas.md`: unplanned and unimplemented ideas only.
- `plans/<plan-name>/<plan-name>.md`: implementation plan for one scoped change.
- `plans/summary.md`: short index and status snapshot for all plans.

## Lifecycle

1. Capture idea in `docs/ideas.md`.
2. Promote idea to a plan file when implementation is expected.
3. Remove promoted idea from `docs/ideas.md`.
4. Add or update the plan entry in `plans/summary.md`.
5. Refine the plan as codebase context changes.
6. Mark plan status accurately after implementation.

## Plan writing standards

- Write in present tense and current-state language.
- Describe what is being done now, not historical patch notes.
- Use explicit scope and out-of-scope sections.
- Prefer concrete file paths and symbols over vague statements.
- Keep assumptions verifiable from code where possible.
- Avoid stale prerequisites that do not exist in the repo.

Recommended plan sections:

1. Title
2. Status
3. Goal
4. Current state
5. Scope
6. Open decisions (only real unresolved choices)
7. Plan (ordered implementation tasks)
8. Suggested implementation steps

## Refinement workflow

When re-reviewing a plan:

1. Re-read the plan fully.
2. Validate assumptions against current code and config.
3. Remove stale history and old wave-by-wave notes.
4. Rewrite for current intended behavior only.
5. Update related docs (`plans/summary.md`, optionally `README.md` when user-facing features changed).

## Status conventions

Use one of:

- `not started`
- `in progress`
- `implemented`
- `blocked` (include reason)

Status should match the current repo state, not original plan intent.

## Naming conventions

- Plan folder: `plans/plan-<topic>/`
- Plan file: `plans/plan-<topic>/plan-<topic>.md`
- Keep names scoped and implementation-focused.
- Rename plan files/folders when scope changes materially.

## Ideas file rules

- Remove any idea that:
  - already has a plan in `plans/`, or
  - has already been implemented.
- Keep only open, unplanned backlog items.

## Summary file rules

Each entry in `plans/summary.md` should include:

- link to the plan file
- current status
- short value statement (severity/urgency/worth doing)
- concise implementation snapshot

Update the summary any time a plan is created, renamed, re-scoped, or implemented.

## Review checklist

Before closing a planning/refinement task, verify:

- [ ] `docs/ideas.md` contains only open, unplanned ideas.
- [ ] Plan file reflects current intended behavior.
- [ ] No stale references to missing plans/files remain.
- [ ] `plans/summary.md` matches plan status and scope.
- [ ] Terminology is consistent across plan, summary, and README.

