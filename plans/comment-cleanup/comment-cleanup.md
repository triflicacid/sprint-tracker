# Plan: comment and test-name cleanup

Status: **in progress**.

Goal:
1. Review comments across the codebase and keep only short, useful, non-obvious ones.
2. Standardize test names to concise, all-lowercase wording.
3. Add or expand TSDoc for functions that need it, using well-formatted multi-line blocks.

## Documentation rules

- Comments should be short, concise, and all-lowercase.
- Comments should explain non-obvious intent, constraints, or edge cases only.
- Remove comments that simply restate the code.
- Non-TSDoc comments should use single-line `//` comments, not block comments.
- Simple single-line comments should not end with a full stop.
- Test names should be concise, behavior-focused, and all-lowercase.
- In route-style test titles, keep HTTP methods uppercase (for example `GET`, `POST`, `PATCH`, `DELETE`).
- Keep standard protocol/format acronyms uppercase where clearer (for example `JSON`, `URL`, `API`).
- Function TSDoc should use nicely formatted multi-line blocks.
- Function TSDoc should include:
  - a short summary
  - `@param` entries for each parameter
  - `@returns` for non-void return values only
- Keep context where helpful, but avoid over-explaining.

## Exception

- Long comments in `data/testing_data.sql` are okay and should not be shortened just to match the rest of the repo.

## Current state

- Most source files use informal single-line comments rather than TSDoc.
- Test names are generally descriptive, but style varies across Vitest and Playwright suites.
- There is no current lint rule enforcing documentation or test-name wording conventions.

## Scope

- Review comments and TSDoc in:
  - `server/`
  - `shared/`
  - `src/`
  - `electron/`
- Review test names in:
  - `shared/*.test.ts`
  - `server/**/*.test.ts`
  - `server/tests/integration/`
  - `src/tests/`
  - `e2e/*.spec.ts`
- Leave long explanatory comments in `data/testing_data.sql` alone.

## Plan

### 1) Inventory and classify existing comments

- Find inline comments, block comments, and existing TSDoc blocks.
- Classify each as:
  - keep
  - shorten
  - rewrite
  - remove
- Preserve comments that explain hidden behavior, constraints, or tricky edge cases.

### 2) Standardize comment style

- Rewrite kept comments in concise, all-lowercase wording.
- Remove filler phrasing and obvious restatements.
- Prefer one short comment over stacked comment blocks unless extra context is truly needed.

### 3) Standardize test names

- Rewrite `describe`, `it`, and `test` names to all-lowercase.
- Prefer short, behavior-first phrasing.
- Avoid `should` where a direct verb phrase reads more cleanly.
- Keep e2e names descriptive enough to explain the flow under test.

### 4) Add and normalize TSDoc

- Replace function header comments with proper TSDoc where documentation is useful.
- Use multi-line formatting even for short docs.
- Keep summaries concise.
- Add `@param` and `@returns` entries where applicable.
- Do not add noisy TSDoc to trivial private helpers unless the intent is not obvious.

### 5) Validate safely in batches

- Edit in small directory-based passes to keep diffs reviewable.
- Verify that renaming tests does not affect behavior.
- Run targeted checks after each batch.

## Suggested rollout order

1. ~~`shared/`~~
2. ~~`server/`~~
3. `src/`
4. ~~`electron/`~~
5. `e2e/`

## Risks and guardrails

- Broad wording-only changes can create noisy diffs, so keep edits minimal.
- Some long e2e test names act as documentation; shorten them carefully.
- Avoid converting every helper comment into TSDoc when it adds no value.
- Do not apply the short-comment rule to `data/testing_data.sql`.

