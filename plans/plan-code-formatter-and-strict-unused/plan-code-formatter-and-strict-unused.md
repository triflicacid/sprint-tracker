# Plan: code auto-formatter + stricter unused-var/type checks

Status: **not started** — plan/exploration only, no code yet. Picked up from the `docs/ideas.md`
tech-debt entry "Add code auto-formatter to project", plus a follow-up requirement raised in the same
session: "I would also like unused variables/types to be flagged as errors during tsc". Two related
but independent pieces of dev-tooling, both about catching/fixing sloppiness mechanically rather than
by review:
1. A **formatter** (whitespace/quote-style/line-wrap consistency) — nothing enforces this today.
2. **`noUnusedLocals`/`noUnusedParameters`** in `tsc` (dead imports/variables/types) — explicitly
   *disabled* in the two tsconfigs that set it at all, flip to enabled + clean up what that reveals.

## Current state

- **No formatter or linter installed at all.** No `eslint`/`prettier` in `package.json`
  dependencies, no `.eslintrc*`/`eslint.config.*`/`.prettierrc*` at the repo root (checked directly —
  the only hits for any of those filenames are inside `node_modules`, i.e. other packages' own
  configs, not this project's). `.editorconfig` exists but only sets `end_of_line = lf` — no
  indent/quote/width rules at all.
- **No shared IDE code style either.** This is a WebStorm project (`.idea/` is present and
  git-tracked per `.idea/.gitignore`'s narrower excludes), but there's no `.idea/codeStyles/`
  directory — so today, formatting consistency depends entirely on each dev's personal WebStorm
  settings, unenforced and unshared.
- **Observed existing convention** (sampled across `src/`, `server/`): 4-space indentation, double
  quotes throughout (338:1 double:single in a spot-check of `StatsPage.tsx`), semicolons on every
  statement, trailing commas used in multiline literals. Any formatter config adopted should match
  this rather than fight it — reformatting the whole tree to a *different* style (e.g. single quotes,
  tabs) would produce a needless, enormous diff with zero functional value.
- **`noUnusedLocals`/`noUnusedParameters` are explicitly set to `false`** in both `tsconfig.json`
  (client) and `server/tsconfig.json` — not just left at their (also-`false`) default, someone
  deliberately wrote `"noUnusedLocals": false` in both files. `electron/tsconfig.json` doesn't
  mention either flag (implicit `false`). Reason for the explicit `false` isn't recorded anywhere
  found (no comment, no `docs/` mention) — worth a quick "does anyone remember why" before flipping,
  though the violation scan below (small, mechanical) suggests it was never a deliberate "we rely on
  unused locals" decision, just never turned on.
- **`scripts/run-checks.ps1`** already runs all three typechecks as separate steps
  (`npx tsc -p tsconfig.json --noEmit`, `-p server\tsconfig.json`, `-p electron\tsconfig.json`) — since
  the flags live in the tsconfig files themselves, no changes needed to this script; enabling the
  flags there is automatically picked up.

### Scan: what turning the flags on right now would actually break

Ran `npx tsc -p <project> --noEmit --noUnusedLocals --noUnusedParameters` (CLI override, no files
changed) against all three projects to gauge blast radius before recommending the flip. Small and
entirely mechanical — 16 violations total, **zero** in `electron`:

**Client (12):**
- 11 files import `React` as a default import that's never referenced (dead now that
  `jsx: "react-jsx"` — the new JSX transform — no longer needs `React` in scope just to use JSX):
  `components/calendar/SprintActivityCalendar.tsx`, `SprintRangeCalendar.tsx`,
  `SubtaskActivityCalendar.tsx`, `components/flow/FlowDiagram.test.tsx`,
  `components/stats/StatusBreakdownChart.tsx`, `components/StatusBadge.tsx`,
  `components/subtasks/SubtaskRow.test.tsx`, `SubtaskTransitionsTable.tsx`,
  `components/TagFilter.tsx`, `pages/CalendarPage.tsx`, `pages/StatsPage.tsx`.
- `pages/TransitionsInfoPage.tsx`: unused `FlowState` type import.

**Server (4):**
- `server/app.ts`: unused `Express` type import (the error-handler in the same file already uses the
  `_req`/`_next` underscore-prefix convention for its own unused params — `noUnusedParameters`
  respects that convention automatically, so that line is already compliant).
- `server/routes/statusFlow.ts`: unused `req` param (not yet underscore-prefixed).
- `server/services/statusFlowService.ts`: unused `FlowField` type import.
- `server/tests/integration/stats.test.ts`: `storyId` assigned in `beforeEach` but never read
  anywhere in the file (only `sprintId` is actually used by the tests) — genuinely dead, not just
  under-used.

None of these are subtle — every one is either a leftover pre-new-JSX-transform import or a
copy-paste-and-forgot-to-use variable. No behavior-relevant code depends on any of them.

## Plan

### Piece 1 — `noUnusedLocals`/`noUnusedParameters`
- Flip both to `true` in `tsconfig.json` and `server/tsconfig.json`; add both (`true`) to
  `electron/tsconfig.json` (currently absent, so implicitly `false` — should get the same treatment
  for consistency even though its current violation count is zero).
- Fix the 16 violations above as part of the same change: drop the 11 dead `React` default imports
  (keep any named imports on the same line, e.g. `StatsPage.tsx`'s `import React, { useEffect,
  useRef, useState } from "react"` → `import { useEffect, useRef, useState } from "react"`), drop the
  two dead type imports, prefix `statusFlow.ts`'s `req` with `_` (matching the existing
  `app.ts`-established underscore convention for intentionally-unused handler params rather than
  removing the parameter, since Express handlers need the full signature), and delete the dead
  `storyId` declaration/assignment in `stats.test.ts`.
- This is small enough to do as one immediate mechanical pass, not a phased rollout.

### Piece 2 — formatter
- **Recommend Prettier** over ESLint's formatting rules or a bespoke config: it's the de facto
  standard for a TS/React project this size, needs near-zero rule-by-rule bikeshedding (opinionated
  by design), and has first-class WebStorm integration (format-on-save via the built-in Prettier
  plugin) so it doesn't fight the IDE workflow already in use.
- **Config should mirror the observed existing style**, not impose a new one — a first Prettier run
  with a matching config should produce a near-empty diff on already-conventional files, only
  catching genuine inconsistencies:
  ```json
  { "tabWidth": 4, "useTabs": false, "semi": true, "singleQuote": false, "trailingComma": "es5",
    "printWidth": 110 }
  ```
  (`printWidth` is a guess pending a real scan of current line lengths — check the distribution of
  existing line lengths before committing to a number; too low would reformat a lot of already-fine
  long lines, e.g. the multi-clause SQL template strings in `statsService.ts`.)
- **`.prettierignore`**: `dist`, `node_modules`, `data/*.sql`/`*.sqlite3*`, `plans` (already
  gitignored entirely, no need to format throwaway planning docs), `dist/static`.
- **Scope**: default file-type coverage (`.ts`/`.tsx`/`.json`/`.css`/`.md`) — no reason to hand-pick a
  narrower set.
- **Enforcement mechanism — flagged, not resolved**: an `npm run format`/`format:check` script pair
  (check-only used in `run-checks.ps1`, matching this repo's existing style of manual/approvable
  scripts rather than automated git hooks — there are currently no real hooks installed, only the
  default `.sample` files) is the low-ceremony option consistent with how this repo already runs
  checks. A pre-commit hook (or CI gate, if one existed) would enforce it automatically but is a
  bigger step than "add a formatter" strictly asks for — recommend starting with the script pair and
  revisiting automatic enforcement only if formatting drift actually becomes a recurring problem in
  practice.
- **One-time reformat commit**: once config is settled, running Prettier across the whole tree for
  the first time will still touch many files even with a matching config (trailing commas, exact
  wrap points on long lines, etc.) — do this as its own dedicated commit, separate from any
  feature/fix work, so it doesn't pollute unrelated diffs and stays easy to `git blame`-skip.
- **ESLint is explicitly out of scope here** — the `docs/ideas.md` entry asks for a *formatter*
  specifically, and ESLint is a materially bigger decision (rule set choice, `eslint-plugin-react-hooks`,
  wiring into `run-checks.ps1`, potentially real behavioral lint findings to triage rather than
  mechanical reformatting). Worth its own future idea/plan if wanted, not bundled in here.

## Design decisions to flag

- **Why were the unused-var flags off in the first place?** No comment/doc found explaining it — the
  scan above suggests it was simply never turned on rather than a considered "we need this off"
  choice, but worth a quick sanity check before flipping (e.g. in case there's a WIP branch somewhere
  relying on an unused import as a marker) rather than assuming.
- **`printWidth` needs a real number**, not the guessed `110` above — pick it from an actual
  distribution of current line lengths across `src`/`server`, not arbitrarily, so the first format
  pass doesn't rewrap a large fraction of already-reasonable lines.
- **Formatter enforcement**: script-pair vs. git hook vs. "nothing, just run it manually occasionally"
  — recommended the middle ground (script pair, no automatic hook) above, but this is a real
  preference call, not something inferable from the code.
- **Order of the two pieces**: no dependency between them — piece 1 (unused-var flags) is smaller,
  fully scoped already (exact file list above), and safe to do first and separately; piece 2
  (formatter) involves a genuine config/enforcement decision and a large one-time diff, better done
  as its own follow-up once the config questions above are settled.

## Suggested implementation steps (when picked up)

1. Re-verify the violation list and file/line references above still hold — written from a
   point-in-time read of the codebase (2026-07-08); re-run the `--noUnusedLocals --noUnusedParameters`
   CLI-override scan first since this is cheap and catches anything that's changed since.
2. Ship piece 1 alone first (flags + the 16-violation cleanup) — small, mechanical, independently
   reviewable, no config decisions pending.
3. Settle piece 2's two open calls (`printWidth`, enforcement mechanism) before installing Prettier.
4. Add `prettier` as a dev dependency, `.prettierrc`/`.prettierignore`, `npm run format`/
   `format:check` scripts, wire `format:check` into `scripts/run-checks.ps1` as a new step.
5. Run the one-time full-tree reformat as its own dedicated commit.
