# Plans summary

Brief index of everything under `plans/`. Each entry links to the full doc — check there before
acting on anything, since plans are point-in-time snapshots and code may have moved since.

## [code formatter](plan-code-formatter/plan-code-formatter.md)

**Status: not started**

**Severity: low | Urgency: low | Worth doing: medium-high** — no correctness risk, but formatting
consistency and check automation reduce day-to-day diff noise and review churn.

Adds Prettier as formatter while keeping ESLint as the lint baseline. Includes `eslint-config-prettier`
so ESLint stylistic rules do not conflict with formatting. Adds `format` and `format:check` scripts,
plus `pnpm lint` and `pnpm format:check` in `scripts/run-checks.ps1`. Recommends one dedicated
format-only commit for the first full-tree run.

## [manual lock toggle for stories and subtasks](plan-manual-lock-toggle/plan-manual-lock-toggle.md)

**Status: not started**

**Severity: low | Urgency: low | Worth doing: medium** - useful workflow control for freezing work
before sprint end, with clear separation from date-based sprint locks.

Adds reversible manual lock flags for `stories` and `subtasks`, with story-to-subtask cascade at
runtime. Keeps sprint-end lock behavior unchanged and absolute. Includes dedicated lock endpoints
(`PATCH /api/stories/:id/lock`, `PATCH /api/subtasks/:id/lock`), shared lock/error helpers,
service-level enforcement with `409` responses, and UI lock toggles via `LockIcon`.

## [bundle installer / single exe for Electron](plan-electron-installer/plan-electron-installer.md)

**Status: not started**

**Severity: low | Urgency: low | Worth doing: low-medium** - relevant when distributing outside local
development; scoped as a practical packaging pass rather than exploratory research.

Adds Windows packaging with `electron-builder`, targeting a portable executable first. Keeps scope to
core delivery concerns: packaging config (`files`, `portable` target, icon, and `asar`/`asarUnpack` for
`better-sqlite3`), build pipeline updates so `dist/electron` is included, explicit server-ready
handshake before `loadURL`, and runtime verification from a non-repo launch location. Leaves code
signing and auto-update out of scope for the first pass, and keeps packaged DB location
(`app.getPath("userData")` vs executable-adjacent) as an explicit product decision.

## [global search across sprints, stories, and subtasks](plan-global-search/plan-global-search.md)

**Status: not started**

**Severity: medium | Urgency: medium | Worth doing: high** - restores searchability that existed when
data was in a single markdown file; critical for finding information quickly across the entire project
history.

Adds a dedicated search page (`/search`) with real-time cross-entity search. Includes text highlighting
for matches, result cards linking to detail pages, and flexible filtering (entity type, parent story,
subtask type). Backend uses SQL `LIKE` queries with snippet extraction and match position tracking.
Frontend includes debounced input, empty/loading states, and responsive card-based results layout.
Future-ready for FTS5 upgrade if needed for performance at scale.

