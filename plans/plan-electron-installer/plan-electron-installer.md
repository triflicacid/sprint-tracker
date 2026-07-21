# Plan: bundle installer / single exe for Electron

Status: **not started — exploratory, higher uncertainty than the other plans in this folder**.
Picked up from `docs/ideas.md`: "`[?]` Bundle installer/single exe for electron?" — the `[?]` is the
idea's own author flagging it as unsettled, and this write-up stays fairly open-ended for the same
reason rather than prescribing one path.

## Current state

There is genuinely no packaging setup today — no `electron-builder`/`electron-forge`/
`electron-packager` dependency, no `build` config key in `package.json`, no `forge.config.*` or
`electron-builder.yml` anywhere in the repo. Running "as an app" today means: `npm run build` (produces
`dist/client` + `dist/server` + `dist/static`), then separately `tsc -p electron/tsconfig.json`
(produces `dist/electron`, **not** part of the `build` script), then `electron dist/electron/main.js`.
Nothing downloadable or double-click-installable exists.

**How the app currently locates things — this is the main thing packaging would break:**
- `electron/main.ts:18` sets `process.env.DB_PATH` to an absolute path derived from `__dirname`
  (`<electron-main-dir>/../../data/sprint-tracker.sqlite3`) — this part **is** packaging-safe already,
  it doesn't depend on cwd. Two other lookups aren't: `server/db/connection.ts`'s `schema.sql` read
  and `server/app.ts`'s client-static-serving path are both `process.cwd()`-relative rather than
  location-derived, and would fail once launched from anywhere other than the project root (exactly
  what a packaged app's launch context looks like). **Split out to its own plan**, since it's a
  latent bug independent of packaging, not something specific to it — see
  [fix `process.cwd()`-relative path bugs in the server](../plan-fix-cwd-relative-paths/plan-fix-cwd-relative-paths.md).
  Treat that plan as a prerequisite here.
- `electron/main.ts`'s `startServer()` also has no explicit "server ready" handshake — it awaits the
  dynamic `import()` of `dist/server/index.js` resolving, then immediately calls `loadURL`, without
  waiting for `app.listen()`'s callback to actually fire. Works today by apparent timing luck; a
  packaged build (different disk/startup timing) is exactly the kind of change that could expose
  this as a real race.
- `better-sqlite3` is a native module, already rebuilt for Electron's ABI via
  `electron-rebuild -f -w better-sqlite3` (`package.json`'s `electron:rebuild` script) — see the
  sibling [[dependency-audit]]-adjacent plan, `upgrade-libraries/dependency-audit.md`, which already
  recommends swapping the underlying `electron-rebuild` package for `@electron/rebuild`. That swap
  is independent of this plan but should land first — no reason to build packaging on top of a
  devDependency already flagged for replacement.
- No app icon exists anywhere in the repo (`static/` has only `agile.png`, `logo.png`, `run.png` plus
  JSON config) — Windows installers need a `.ico` (electron-builder requires one for the `nsis`/`win`
  target), which doesn't exist yet and would need generating from `static/logo.png` or similar.

## Open decisions (bigger than usual for this project's plans — genuinely unresolved)

- **Installer vs. true single exe.** These are different things: an NSIS installer (electron-builder's
  default Windows target) installs into `Program Files` or a user directory and creates Start Menu/
  Desktop shortcuts; a "portable"/single-exe build is one self-contained `.exe` with no install step.
  electron-builder supports both (`target: nsis` vs `target: portable`) from the same config — this
  isn't an either/or on tooling, just on which `target` to build. Recommend starting with `portable`
  since it sidesteps install-location/uninstall/permissions questions entirely, and it's the simpler
  one to get right first; NSIS can be added later without redoing anything.
- **Where does the database live once installed?** Today `DB_PATH` defaults to a path next to the
  source tree (`data/sprint-tracker.sqlite3`). A portable exe run from anywhere, or an NSIS install
  under `Program Files` (commonly not writable without elevation), makes "next to the app" a bad
  default for a real install — the standard Electron convention is `app.getPath("userData")`
  (`%APPDATA%/<app-name>` on Windows). This only affects **new packaged installs**, not the existing
  dev DB (`data/sprint-tracker.sqlite3`, which already holds real historic data per
  [[project_sprint_tracker_status_flow]]) — but it's a real design decision, not a detail, and
  affects where a packaged user's data would live and get backed up from.
- **asar + native modules.** electron-builder's default packs app code into a single `asar` archive;
  `.node` native binaries (i.e. `better-sqlite3`'s compiled module) generally can't be loaded from
  inside an asar and need `asarUnpack` configured for that dependency specifically — a well-known
  but easy-to-miss gotcha given this app's only native dependency is exactly this kind.
  Alternative: disable `asar` entirely for a first pass (simpler, slightly larger/less tidy output)
  and revisit once packaging works at all.
- **Code signing** — unsigned Windows executables trigger a SmartScreen warning on first run.
  Recommend explicitly **not** pursuing signing (it requires a paid certificate) unless this is
  meant to be handed to people who'd be alarmed by that warning; flagging so it's a conscious skip,
  not an oversight.
- **Auto-update** — electron-builder integrates with `electron-updater`, but that requires a
  hosting/release mechanism (e.g. GitHub Releases) to check against. Out of scope unless this is
  meant for more than one machine/person; flagging as a non-goal for a first pass.

## Plan (first pass: portable single exe, no signing, no auto-update)

- **Land the cwd-relative-paths fix first** (`plan-fix-cwd-relative-paths/plan-fix-cwd-relative-paths.md`)
  — blocks packaging regardless of which tool is chosen, and is worth doing on its own either way.
- **Add `@electron/rebuild`** (not `electron-rebuild`) as the native-module rebuild step — per the
  already-drafted dependency-audit plan; electron-builder can also trigger this automatically via
  `electron-builder install-app-deps`, potentially replacing the manual `npm run electron:rebuild`
  step entirely once packaging is in place.
- **Add `electron-builder`** as a devDependency, with a `build` config (in `package.json` or a
  separate `electron-builder.yml`) covering: `files` (what actually ships: `dist/client`,
  `dist/server`, `dist/static`, **not** `data/*.sqlite3` — ship `data/schema.sql` only, never a real
  data file), `asarUnpack` for `better-sqlite3`, `win.target: portable`, and an `.ico` (needs
  generating first).
- **Extend the build pipeline**: `npm run build` today doesn't produce `dist/electron` at all (that's
  the separate `electron` script) — add a `build:electron` step (or fold `tsc -p
  electron/tsconfig.json` into `build`) so a single command produces everything a packaging step
  needs, then a new `package`/`dist` script invokes `electron-builder`.
- **Fix the server-ready race** while touching `main.ts` anyway — have `server/index.ts`'s
  `app.listen()` signal readiness (e.g. resolve a promise / emit once listening) back to
  `startServer()`, and only call `loadURL` after that resolves, instead of racing on `import()`
  completing.

## Suggested implementation steps (when picked up)

1. Re-verify the file/line references above still hold — written from a point-in-time read of the
   codebase (2026-07-08).
2. Land `plan-fix-cwd-relative-paths` (prerequisite — see above).
3. Fix the `loadURL`/server-ready race in `main.ts`/`server/index.ts`.
4. Swap `electron-rebuild` → `@electron/rebuild` (if not already done via the sibling
   dependency-audit plan).
5. Generate a `.ico` from an existing asset (`static/logo.png` or similar).
6. Add `electron-builder`, a minimal `build` config (`files`, `asarUnpack`, `win.target: portable`,
   `icon`), and a `package` script.
7. Decide and implement the installed-DB-location question (`app.getPath("userData")` vs. staying
   next to the binary) — needed before step 6's config is actually final, listed after it here only
   because it's a decision, not because it comes later in practice.
8. Build once, run the resulting `.exe` from a directory that is **not** the project root, and
   confirm: the UI loads, the db is created/opened in the right place, and a subtask/story can
   actually be created — i.e. verify end-to-end, not just that packaging "succeeds".
