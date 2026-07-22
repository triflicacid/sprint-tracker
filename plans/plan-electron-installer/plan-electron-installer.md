# Plan: bundle installer or single exe for Electron

Status: **not started**. Plan only, no code changes yet.

Goal: produce a distributable Windows build of the Electron app, starting with a portable single exe.

## Current state

- There is no packaging tool configured yet (`electron-builder`, `electron-forge`, or equivalent).
- Build output currently includes client and server artifacts, while Electron main is compiled separately.
- `@electron/rebuild` is already installed in `package.json`.
- Runtime paths are set explicitly for Electron launches:
  - `electron/main.ts` sets `DB_PATH`, `DATA_DIR`, and `CLIENT_DIST_PATH`.
  - `server/index.ts` also derives and sets `DATA_DIR` and `CLIENT_DIST_PATH` from a discovered repo root.
- `electron/main.ts` imports the server entry and then immediately calls `loadURL`. There is no explicit
  "server is listening" handshake before opening the browser window.
- No Windows `.ico` exists yet for packaging targets that require an app icon.

## Scope

- Primary target: Windows portable executable (`target: portable`).
- First pass excludes code signing and auto-update.
- First pass includes native module compatibility for `better-sqlite3`.

## Open decisions

- **Portable vs installer first**
  - Start with `portable` to minimize installer and permission complexity.
  - Add NSIS installer later if needed.
- **Packaged database location**
  - Decide whether packaged app data should live in `app.getPath("userData")` (recommended) or next to the executable.
  - Keep dev database behavior unchanged.
- **ASAR strategy**
  - Either keep ASAR enabled with `asarUnpack` for `better-sqlite3`, or disable ASAR for first pass simplicity.
- **Rebuild integration**
  - Keep manual `electron:rebuild` flow, or integrate rebuild into the packaging pipeline.

## Plan

1. Add `electron-builder` and configure packaging in `package.json` (or dedicated config file):
   - `win.target: portable`
   - `files` includes `dist/client`, `dist/server`, `dist/static`, `dist/electron`
   - exclude runtime sqlite database files from shipped artifacts
   - include `data/schema.sql`
   - configure `asar` and `asarUnpack` decision for `better-sqlite3`
2. Update build pipeline so one command produces all package inputs:
   - ensure Electron TS build runs as part of distributable build flow
   - add a dedicated packaging script (for example `package:win`)
3. Implement an explicit server-ready handshake:
   - server startup resolves readiness only after `app.listen` is active
   - Electron window calls `loadURL` only after readiness resolves
4. Align native rebuild flow with current dependency setup:
   - ensure `electron:rebuild` calls the correct `@electron/rebuild` command path
   - verify rebuild works before packaging
5. Add app icon assets for Windows packaging:
   - generate `.ico` from existing branding asset
   - wire icon path into builder config
6. Validate packaged runtime behavior:
   - run produced exe from a non-repo directory
   - verify app starts, UI loads, DB is created/opened in expected location, and write operations succeed

## Suggested implementation steps

1. Add `electron-builder` dependency and minimal `portable` config.
2. Add build and packaging scripts (`build:electron`, `package:win`).
3. Add server-ready handshake between `server/index.ts` and `electron/main.ts`.
4. Align `electron:rebuild` script to the installed `@electron/rebuild` tooling.
5. Add `.ico` and connect it in packaging config.
6. Run a local packaging build and smoke-test the generated executable.
