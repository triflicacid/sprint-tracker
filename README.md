# Sprint Tracker

A personal tool for tracking sprints, stories and subtasks/branches/pull
requests outside of Jira.

A sprint contains stories, each linked to a Jira
issue; each story contains subtasks, and a subtask maps 1:1 to a single git
branch/pull request.

Built once, and can be run in the web or in Electron.

The favicon was sourced from <a href="https://www.flaticon.com/free-icons/run" title="run icons">Run icons created by srip - Flaticon</a>.

## Features

- Track sprints, stories and subtasks in one place, alongside their linked Jira issues
- Subtasks support categories (feature, bugfix, tech-debt, spike) with icons
- Each subtask follows a clear status workflow from not-started through to released
- Story progress is worked out automatically from the status of its subtasks
- Optional Jira integration to pull in an issue's title and labels
- Full history of every status change, viewable as flow diagrams
- Calendar views for sprint timelines and day-to-day activity
- A stats page with charts summarising sprint progress, including cross-sprint velocity trends
- Tagging support, both automatic (by repo) and custom labels
- Holiday tracking, so calendars can distinguish working days
- Export any set of sprints to a markdown file, with a picker for which story/subtask fields to include
- Export the stats page (or any single chart/calendar on it) to a PDF report
- Export a story to a PDF report
- Runs as a browser app or as an Electron desktop app

## Commands

### Prod use

| Command            | What it does                                                                                           |
|--------------------|--------------------------------------------------------------------------------------------------------|
| `clean`            | Removes the `dist/` build output.                                                                      |
| `copy:assets`      | Copies `static/` into `dist/static` (part of the server build).                                        |
| `build:client`     | Type-checks and builds the React client with Vite into `dist/`.                                        |
| `build:server`     | Type-checks the server, then runs `copy:assets`.                                                       |
| `build`            | Runs `build:client` then `build:server` - the full production build.                                   |
| `start:server`     | Runs the built server (`dist/server/index.js`), serving the built client and API together.             |
| `electron`         | Compiles the Electron main/preload scripts and launches the Electron app against the build in `dist/`. |
| `electron:rebuild` | Rebuilds native modules (`better-sqlite3`) against Electron's Node ABI.                                |

> **NOTE** When running `electron` or `start:server`, you may see errors about conflicting node versions.
> If you see this after running `electron`, run `electron:rebuild` and retry.
> If you see this for `start:server`, run `npm rebuild better-sqlite3 --update-binary` and retry.

### Dev use

| Command              | What it does                                                                                                         |
|----------------------|----------------------------------------------------------------------------------------------------------------------|
| `dev:server`         | Runs the Express API with `tsx watch` on http://localhost:4000, restarting on file changes.                          |
| `dev:client`         | Runs the Vite dev server on http://localhost:5173, proxying `/api` to the Express server.                            |
| `db:run-sql`         | Applies `data/schema.sql`, then runs a given `.sql` file against the database (`node data/run-sql-file.mjs <file>`). |
| `db:clear`           | Wipes every table (drops and reapplies the schema) via `data/clear-database.mjs`.                                    |
| `db:load:test`       | Loads `data/testing_data.sql` - a small, made-up dataset for testing.                                                |
| `db:load:historical` | Loads `data/existing_history.sql` - real work history from when the project was created.                             |
| `db:dump`            | Dumps the current database to a timestamped (or named) `.sql` file via `data/dump-database.mjs`.                     |

### Testing

| Command                                       | What it does                                                                                                                                |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `test`                                        | Runs unit, integration and e2e test suites in sequence.                                                                                     |
| `test:unit` / `test:unit:watch`               | Runs (or watches) the Vitest unit suite (`vitest.unit.config.ts`).                                                                          |
| `test:integration` / `test:integration:watch` | Runs (or watches) the Vitest integration suite (`vitest.integration.config.ts`), covering both server API and React page integration tests. |
| `test:e2e` / `test:e2e:ui`                    | Runs the Playwright e2e suite headlessly, or with its interactive UI runner.                                                                |

### Scripts (`scripts/`)

Standalone PowerShell scripts, run directly rather than through `npm run`:

| Script                        | What it does                                                                                                                                                                                                                                      |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `scripts/kill-dev-ports.ps1`  | Kills whatever is listening on the dev ports (`4000`, `5173` by default - pass `-Ports` to override), e.g. `.\scripts\kill-dev-ports.ps1`.                                                                                                        |
| `scripts/run-checks.ps1`      | Runs typecheck (client/server/electron), unit and integration tests in one go. Add `-E2e` to also run the full e2e suite, or `-E2eSpec <path>` for just one e2e spec file, e.g. `.\scripts\run-checks.ps1 -E2eSpec e2e\story-pdf-export.spec.ts`. |
| `scripts/clean-reinstall.ps1` | Used to clean install all node modules.                                                                                                                                                                                                           |

## Quick start

### 1. Set up the database

```bash
npm install
npm run db:load:test    # applies data/schema.sql, then loads testing_data.sql
```

Both `db:run-sql`, `db:clear` and `db:dump` work directly against
`better-sqlite3` with no build step, and all respect the `DB_PATH`
environment variable (defaulting to `data/sprint-tracker.sqlite3` when
unset) - see [Environment variables](#environment-variables) below.

### 2. Run in development

In two terminals:

```bash
npm run dev:server     # express api on http://localhost:4000
npm run dev:client     # vite dev server on http://localhost:5173, proxies /api
```

Open http://localhost:5173 in a browser.

### 3. Build and run in a browser

```bash
npm run build           # builds the client, then the server
npm run start:server
```

Open http://localhost:4000 - the Express server serves the built client
and API from the same origin.

### 4. Build and run in Electron

```bash
npm run build
npm run electron
```

The Electron main process starts the Express server itself and points the
database file at Electron's user data directory, so the same code path
runs whether the app is opened in a browser or as a desktop window.

> **Note:** `better-sqlite3` is a native module compiled against a specific
> Node ABI. If you switch Node versions (or install fresh) and Electron
> fails to start with a native module / NODE_MODULE_VERSION mismatch
> error, run `npm run electron:rebuild` to rebuild it against Electron's
> bundled Node version, then try `npm run electron` again.

## Environment variables

Copy [`example.env`](example.env) to `.env` and fill in whichever values you
need - every variable the app reads is documented there with a comment and
an example value, so it doubles as the reference.

`.env` is loaded automatically by the Express server
(`server/index.ts`), the Electron main process, and the `data/*.mjs` db
scripts. The one exception is
`VITE_API_PROXY_TARGET`, which the Vite dev client (`dev:client`) loads
itself, independently of `dotenv`.

## Jira integration

Optional - enables the "refresh from Jira" action on a story. Set
`JIRA_BASE_URL`, `JIRA_EMAIL` and `JIRA_API_TOKEN` (see
[`example.env`](example.env) for what each one does and an example value).

When set, `server/services/jiraService.ts` calls the Jira REST API
(`/rest/api/3/issue/:key`) using basic auth, and the `GET /api/jira/:key`
route caches the returned title and labels onto the story if a `storyId`
query param is supplied.

Without these set, the Jira refresh endpoint returns a 404 and the story
still works fine using the description and Jira link you entered manually.

## Dev notes

See the API schema at [`docs/api.yaml`](docs/api.yaml).

For code style and documentation conventions, see [`docs/comment-guidelines.md`](docs/comment-guidelines.md).

Top-level directories:

- `data/` - database schema, sql datasets, and every db management script
- `docs/` - `openapi.yaml`, the REST API's OpenAPI/Swagger schema
- `e2e/` - Playwright end-to-end specs, plus test-db seeding/setup helpers
- `electron/` - Electron main process and preload script
- `server/` - Express REST API, sqlite access, business logic, and its tests
  - `db/` - connection.ts, opens the sqlite db, initSchema()
  - `services/` - one file per domain concept (sprints, stories, subtasks, tags, status history, status flow, stats, holidays, jira)
  - `routes/` - thin Express routers, one per resource, delegate to services
  - `utils/` - small pure helpers (parsing repo names, jira keys)
  - `testUtils/` - shared setup for the server's own unit/integration tests
  - `tests/integration/` - supertest-driven API integration tests
- `shared/` - types shared between the server and the React client (`types.d.ts`)
- `src/` - React client (Vite)
  - `api/` - typed fetch client for the REST API
  - `pages/` - one component per screen/route
  - `components/` - reusable pieces, grouped by domain (common/, sprints/, stories/, subtasks/, calendar/, stats/, flow/)
  - `utils/` - shared client-side helpers (e.g. calendar grid/date math)
  - `testUtils/` - shared setup for the client's own unit/integration tests
  - `tests/integration/` - React Testing Library integration tests per page
- `static/` - static resources served by the app, including `status_flow.json` (the status flow document, see Features above) and the icon
