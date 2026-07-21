# Plans summary

Brief index of everything under `plans/`. Each entry links to the full doc — check there before
acting on anything, since plans are point-in-time snapshots and code may have moved since.

## [collapsible sections on the export page](plan-collapsible-export-sections/plan-collapsible-export-sections.md)

**Status: not started**

**Severity: none | Urgency: low | Worth doing: medium** — pure UX polish; self-contained with no
backend or schema changes.

Adds a `CollapsibleSection` shared component (new `src/components/CollapsibleSection.tsx` +
`.css`) used to wrap each `<h2>` section on `ExportPage`. Each section is open by default with a
down-pointing chevron to the left of the title. Clicking the title row (text or chevron) rotates
the chevron 90° to point right (CSS transition, ~150 ms) and replaces the section body with a
single horizontal rule. State is ephemeral — resets to open on navigation. Three file touches:
the new component, its CSS, and `ExportPage.tsx`.

## [code auto-formatter + stricter unused-var/type checks](plan-code-formatter-and-strict-unused/plan-code-formatter-and-strict-unused.md)

**Status: not started**

**Severity: low | Urgency: low | Worth doing: medium-high** — no correctness risk, but unused-var
drift and inconsistent formatting is quiet tech debt that compounds; cheap now (16 known violations),
gets more expensive to retrofit the longer it's left.

Two independent dev-tooling pieces. (1) Enable `noUnusedLocals`/`noUnusedParameters` in all three
tsconfigs (`tsconfig.json`/`server/tsconfig.json` currently set them to `false` explicitly;
`electron/tsconfig.json` doesn't set them at all) — a live scan found exactly 16 existing violations
(mostly dead `React` default imports, now unnecessary under the `react-jsx` transform), all listed
with file/line, small enough to fix in one pass. (2) Add a formatter — recommends Prettier, configured
to match the codebase's existing observed style (4-space indent, double quotes, semicolons) rather
than impose a new one, with an `npm run format`/`format:check` script pair over a git hook. Flags two
open calls: the real `printWidth` to use (needs a line-length scan, not guessed), and whether
enforcement should be a hook or stay manual/script-based. Explicitly scopes ESLint out as a bigger,
separate follow-on.

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

## [subtask type icons](subtask-type-icons/subtask-type-icons.md)

**Status: not started**

**Severity: none | Urgency: low | Worth doing: medium** — pure UX polish on its own, but has knock-on
value since the branch-autogen plan's `tech-debt/` prefix depends on it.

Icon mockups for 9 subtask "type" categories, split into **basic** (feature, bugfix, tech-debt,
spike) and **advanced** (chore, docs, test, security, perf) tiers — each with a distinct flat SVG
icon (standalone `.svg` files in this folder). Covers recording the type as a nullable `subtasks.type`
column, a data-driven `static/subtask-types.json` config (draft included, `shortName`/`fullName`/
`description`/`iconPath`/`tier`) instead of a hardcoded TS union, a native-`<select>` creation dropdown
grouped by tier via `<optgroup>`, and where the icon renders on `SubtaskRow` (top-left corner, still
undecided between inline-in-header vs. an absolute-positioned corner badge).

## [story vs. bug icons](story-bug-icons/story-bug-icons.md)

**Status: not started**

**Severity: none | Urgency: low | Worth doing: low-medium** — small, self-contained visual affordance;
nice-to-have, nothing else depends on it.

Ideation for flagging a story as a bug report vs. a regular story, each with its own icon (green
open-book for `story`; the same bug icon used by the subtask `bugfix` type, shared rather than
duplicated) rendered inline in `StoryCard`'s header. Proposes a boolean `stories.is_bug` flag
(mirroring the existing `awaiting_more_subtasks` column) over a `kind` string, a checkbox in the story
creation form, and a `static/story-types.json` config in the same shape as the subtask-types one,
with `iconPath`s flattened to a single shared `static/icons/` directory.

## [past sprints are locked and cannot be edited](plan-lock-past-sprints/plan-lock-past-sprints.md)

**Status: not started**

**Severity: low | Urgency: low | Worth doing: medium-high** — real data-integrity value (stops
accidental edits to historical sprints), and needs no schema change at all since "locked" is derived
from `end_date` having passed rather than a new column.

Derives "locked" from the sprint's existing `end_date` (non-null and in the past) instead of adding a
`status`/`locked` column — avoids the one-off manual `ALTER TABLE` + real-db-edit dance this project's
schema changes normally require, and every historic sprint is correctly locked the instant it ships,
with zero backfill. Enforces at the service layer (`sprintService.updateSprint`,
`storyService.createStory`/`updateStory`/tag add-remove, `subtaskService.createSubtask`/
`updateSubtask`, each resolving the sprint via its existing FK chain) via a new `SprintLockedError`
mapped to a `409`, plus client-side disabling of the same controls once loaded data shows the parent
sprint is locked. Explicitly excludes holidays (global, not sprint-scoped — its own separate idea).
Flags two open calls: whether there's an unlock/override escape hatch (recommends no, for now) and
whether the sprint's one editable field today (comment) should be locked too (recommends yes, for
consistency).

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

## [bundle installer / single exe for Electron](plan-electron-installer/plan-electron-installer.md)

**Status: not started — exploratory, higher uncertainty than other plans here**

**Severity: low | Urgency: low | Worth doing: low-medium** — only matters if actually distributing
this to someone else's machine; the idea's own `[?]` in `docs/ideas.md` suggests that wasn't settled.
Real, non-cosmetic prep work needed first regardless of packaging tool chosen.

No packaging tooling exists today (no electron-builder/forge, no `build` config, no app icon).
Depends on the sibling `plan-fix-cwd-relative-paths` plan landing first (split out separately since
it's a real bug, not just a packaging blocker). Also flags a `loadURL`-before-server-ready race in
`electron/main.ts` with no explicit readiness handshake, and that `better-sqlite3` (the app's one
native dependency) needs `asarUnpack` configured if packed into an asar archive. Recommends starting
with a **portable single exe** (not an NSIS installer) to avoid install-location/permissions
questions, explicitly skipping code signing and auto-update for a first pass. Flags the
installed-DB-location question (`app.getPath("userData")` vs. next to the binary) as a real open
decision — only affects new packaged installs, not the existing dev database. Notes the
`electron-rebuild` → `@electron/rebuild` swap from the dependency-audit plan should land first.
