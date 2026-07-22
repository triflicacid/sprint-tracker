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

## [auto-generate subtask branch name](plan-subtask-branch-name-autogen/plan-subtask-branch-name-autogen.md)

**Status: not started**

**Severity: none | Urgency: low | Worth doing: low-medium** — convenience-only QoL, partially blocked
on `subtask-type-icons` for the full design (can ship a reduced version without the `tech-debt/` prefix
in the meantime).

Pre-fills (and text-selects, so it's easy to overwrite) the branch-name field shown when a subtask
transitions `NEW → WIP`, generated from the story's Jira key + a lowercase-dash-slug of the subtask
title, e.g. `NEB-1234-my-title-here`. Notes that the request's example `tech-debt/` prefix depends on
the not-yet-built subtask-type feature (sibling `subtask-type-icons` plan) and recommends shipping
without it for now, adding the prefix once that plan lands. Sources the story's `jiraKey` onto
`Subtask` itself via a server-side join (new `storyJiraKey` field) rather than prop-drilling or a
second fetch, since `SubtaskDetailPage` doesn't currently load the parent story at all.


## [popup calendar for holiday selection + export date range](plan-holiday-popup-calendar/plan-holiday-popup-calendar.md)

**Status: not started**

**Severity: none | Urgency: low | Worth doing: low-medium** — UX consistency nice-to-have across two
places; well-scoped now that "selected date on the story page" turned out to mean the export page's
from/to range inputs, not the story detail page (no date field exists there).

Replaces two native `<input type="date">` UIs with popup calendars, both built on one shared
popover shell + the grid-layout rendering already extracted from `SprintActivityCalendar` (reusing
`utils/calendarGrid.ts`, already shared by three other calendar components). (1) **Sprint detail
page** (`SprintDetailPage.tsx`): the current input+remove-chip holiday list becomes a
`HolidayPickerPopover` — click-to-toggle, stays open, bounded to the sprint's dates, weekends
disabled — matching the stats page's existing `SprintActivityCalendar` toggle behavior. (2)
**Export page** (`ExportPage.tsx`): the "from"/"to" range inputs become two `DatePickerPopover`
instances — click-to-select-and-close, unbounded, weekends clickable (an export boundary can
legitimately land on one) — leaving `applyDateRange()`'s pre-check-matching-sprints behavior
unchanged. Recommends two thin wrapper components sharing one shell rather than a single
mode-flagged component, since the two use cases differ in bounding/close-behavior/weekend rules.
Flags that no popover/modal infrastructure exists anywhere in the app yet, so shell scope (outside-
click, Escape, positioning) is the main real driver of this plan's size — recommends a minimal
version over full focus-trap/a11y polish for a first pass.

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
