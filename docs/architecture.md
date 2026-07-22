# Architecture

## Deployment topology

- One client build and server runs three ways:
  - **Browser/prod** - Express (`server/`) serves `/api/*` and the built
    client's static files from one origin.
  - **Dev** - Vite dev server (client only) proxies `/api/*` to a
    separately-running Express process (`npm run dev:server`). Only mode
    with client and server on different ports.
  - **Electron** - main process starts the same Express server in-process,
    `DB_PATH` pointed at Electron's user-data dir; `BrowserWindow` loads
    `http://localhost:4000`.
- Client is host-agnostic: `src/api/client.ts` always calls a relative
  `/api/...` path.

## Backend

- Layering: `routes/` (thin, one router per resource, no business logic) →
  `services/` (one file per domain concept, talk to `db` directly) →
  `db/connection.ts` (opens the sqlite file, applies schema).
- `createApp()` (`server/app.ts`) builds the Express app without binding a
  port - integration tests hit it directly via supertest, no real network
  involved. `index.ts` is the only file that calls `initSchema()` +
  `.listen()`.
- No ORM. Raw parameterised SQL + hand-written row→DTO mappers per service.
  Single-user, single-process sqlite, small stable schema - an ORM's main
  value (engine abstraction, generated migrations) doesn't apply here.
- No migration framework, by design. `data/schema.sql` uses
  `CREATE TABLE IF NOT EXISTS`, reapplied on every startup. No released
  installs to preserve compatibility for, so schema changes are hand-edits,
  not guarded `ALTER` scripts. Would need revisiting before any
  multi-install deployment.
- Error convention: a validation failure throws a domain-specific `Error`
  subclass (e.g. `SubtaskUpdateError`); the route catches only that type →
  `400` + message. Anything else falls through to the app-level handler →
  `500`.
- Not-found handling is per-route, not centralized (`null`/`undefined` →
  `404`), and isn't fully uniform: `PATCH /subtasks/:id` on a missing id
  returns `400`, not `404`, because the service's not-found check and its
  transition-validation check throw the same error type. `api.yaml` has the
  exact per-route behavior.

## Domain model

- Sprint → stories (1 Jira issue each) → subtasks. Subtask = 1:1 with a
  single git branch/PR, no separate PR entity - branch name, PR URL, repo
  name, complexity rating and release version all live on the `subtasks`
  row directly.
- Subtask status flow is data, not code: `NEW → WIP → IN_PR → IN_REVIEW →
  PR_COMMENTS → CUT_RELEASE → TESTING → UAT → DONE`, with branching
  (`IN_REVIEW` → `PR_COMMENTS` / `CUT_RELEASE` / back to `IN_PR`). Single
  source of truth is `static/status_flow.json` - states, colors, labels,
  descriptions, allowed transitions, and required fields per transition -
  served verbatim at `GET /status-flow`. Read by both
  `statusFlowService.ts` (server-side transition validation) and
  `StatusBadge.tsx` / `FlowDiagram.tsx` (client-side rendering). One file
  edit changes both sides.
- Story status is derived, never stored. `computeStoryStatus()`
  (`storyService.ts`) folds subtask statuses + `awaitingMoreSubtasks` into a
  `StoryStatus`: `JIRA_ONLY` (no subtasks yet), `WORK_REMAINING` (awaiting
  more subtasks, or none started yet), or otherwise the lowest-rank status
  among its subtasks (so `StoryStatus` is a superset of `SubtaskStatus`, one
  lagging subtask holds the whole story back). No `stories.status` column,
  no flow doc for it - avoids a second source of truth that could drift from
  the subtasks underneath it.
- Status history is one generic table, not one per entity:
  `status_history` (`entity_type` + `entity_id` + `status` + timestamp).
  Powers both the per-subtask flow diagram (real transition edges) and the
  activity calendars. Schema already generalizes to story history; unused
  today, only subtasks write to it.
- Tags: one `tags` / `entity_tags` schema, two `tagType`s. `repo` tags are
  auto-attached to the *story* by `tagStoryWithRepo()` whenever a subtask
  status change carries a PR URL (repo name extracted from the GitHub URL).
  `custom` tags are hand-added from the story detail page. No server-side
  distinction on removal - repo tags simply have no "x" button client-side.
- Holidays are global, not per-sprint: one `holidays` table keyed on date
  only, no `(sprint_id, date)` pair. Matches the real-world entity (a
  holiday isn't sprint-specific); trade-off is no support for a
  sprint-specific day off.
- Jira integration is optional and additive. Unset `JIRA_BASE_URL` /
  `JIRA_EMAIL` / `JIRA_API_TOKEN` → `GET /jira/:key` 404s, rest of the app
  unaffected. A story's Jira link/description are always hand-entered; a
  successful fetch only caches a title/labels on top of that.

## Frontend

- One rule: `src/api/client.ts` is the only file that calls `fetch`. Every
  page/component goes through the typed `api` object. Keeps the REST
  boundary in one place - `api.yaml` and `client.ts` describe the same
  surface from two sides.
- Structure: `pages/` (one per route, fetch via `api`, own screen state) →
  `components/` grouped by domain (`common/`, `sprints/`, `stories/`,
  `subtasks/`, `calendar/`, `flow/`, `stats/`) → `utils/calendarGrid.ts`
  (shared date-grid math).
- Three calendar components, not one - different granularities, not
  duplication: `SprintRangeCalendar` (all sprints as range-lines, one
  navigable month at a time, `/timesheet` "sprints" mode), `SprintActivityCalendar`
  (one sprint's day-by-day activity + holiday toggle, stats page),
  `SubtaskActivityCalendar` (one subtask's own days, detail page). Share
  `calendarGrid.ts`, not markup. Deliberately renamed apart from more
  similar original names once that similarity caused navigation confusion.
- One generic `FlowDiagram` (nodes + `{from,to,title}` edges → arrows), two
  callers with different edge sources: `SubtaskFlowDiagram` (one subtask's
  real history, unreached states dimmed) and `TransitionsInfoPage` (every
  transition `status_flow.json` allows, as reference). Drawing logic is
  identical; only the data feeding it differs.
- `StatusBadge.tsx` derives `STATUS_COLORS` / `STATUS_LABELS` from
  `static/status_flow.json` at import time - not a second hardcoded table.

## Testing

Three layers, isolated from the real db the same way throughout: `DB_PATH`
(read once in `server/db/connection.ts`) points at a throwaway sqlite file
instead of `data/sprint-tracker.sqlite3`. No mocking of the db access layer
itself.

- `vitest.unit.config.ts` - server services + client util functions, no I/O.
- `vitest.integration.config.ts` - server: supertest against `createApp()`
  + a real throwaway sqlite file. Client: React Testing Library against
  real page components, `api` client mocked.
- `playwright.config.ts` - full browser E2E: real Express server + real
  Vite dev server + real throwaway sqlite file, driven with actual clicks.
- E2E runs serially against one shared server + db for the whole run
  (`fullyParallel: false, workers: 1`), not per-test isolation. Specs seed
  data with timestamp-suffixed names / non-overlapping date ranges to avoid
  collisions, cheaper than tearing down and reseeding per test.

## API reference

Full REST surface - routes, request/response shapes, status codes -
in `api.yaml` (OpenAPI 3.0.3).

- Validate: `npx @redocly/cli lint docs/api.yaml`
- Render: paste into [editor.swagger.io](https://editor.swagger.io), or
  `npx @redocly/cli build-docs docs/api.yaml` for a static HTML page.
