# Plan: code formatter

Status: **not started**. Plan only, no code changes yet.

Goal:
1. Add consistent auto-formatting.
2. Keep formatter and ESLint aligned so they do not fight each other.
3. Enforce formatting in project checks.

## Current state

- ESLint is already installed and configured via `eslint.config.mjs`.
- The repo already has a `lint` script in `package.json` (`pnpm eslint .`).
- `scripts/run-checks.ps1` currently runs typechecks and tests, but does not run lint.
- There is no Prettier config or format script yet.

## Plan

### 1) Keep ESLint as lint baseline

- Keep `eslint.config.mjs` as the shared lint entrypoint.
- Add `pnpm lint` to `scripts/run-checks.ps1` so lint runs with existing checks.

### 2) Add Prettier as formatter

- Add `prettier` and `eslint-config-prettier` as dev dependencies.
- Update `eslint.config.mjs` to include `eslint-config-prettier` last so stylistic conflicts are disabled.
- Add `.prettierrc` aligned with current style:
  ```json
  {
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "singleQuote": false,
    "trailingComma": "es5",
    "printWidth": 110
  }
  ```
- Add `.prettierignore` for generated/build/data artifacts (`dist`, `node_modules`, sqlite files, exported assets).
- Add scripts in `package.json`:
  - `format`: `prettier . --write`
  - `format:check`: `prettier . --check`

### 3) Rollout order

- Step A: add Prettier config, ignore file, and scripts.
- Step B: update ESLint config to apply `eslint-config-prettier` last.
- Step C: run one full-tree format pass in a dedicated commit.
- Step D: add `pnpm lint` and `pnpm format:check` to `scripts/run-checks.ps1`.

## Design decisions

- Use ESLint for lint policy and Prettier for formatting only.
- Use `eslint-config-prettier` to avoid formatter-linter conflicts.
- Keep first formatter pass isolated in its own commit to reduce review noise.

## Suggested implementation steps

1. Add `prettier` and `eslint-config-prettier` dependencies.
2. Add `.prettierrc` and `.prettierignore`.
3. Update `eslint.config.mjs` to apply `eslint-config-prettier` last.
4. Add `format` and `format:check` scripts in `package.json`.
5. Run one dedicated repo-wide format pass.
6. Update `scripts/run-checks.ps1` to run `pnpm lint` and `pnpm format:check`.
