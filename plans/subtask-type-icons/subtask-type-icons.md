# Subtask type icons — mockup

Status: **not started** — mockup/design exploration only, picked up from the "New Features"
backlog note in `docs/ideas.md`: "A subtask can be of a given type - feature, bugfix, tech-debt,
spike. Add icons for each," then extended with five more candidate types (chore, docs, test,
security, perf) suggested as generally-useful additions.

Not yet implemented in the app. Rendered mockups live in `plans/subtask-type-icons/`: `overview.png`
for the full picture including an inline usage example (kept as a PNG screenshot — it's a composite
of several elements, not a single icon, and a `foreignObject`-based SVG version of it was tried and
discarded, see note below), plus one standalone SVG per type — `feature.svg`, `bugfix.svg`,
`tech-debt.svg`, `spike.svg`, `chore.svg`, `docs.svg`, `test.svg`, `security.svg`, `perf.svg` — each a
clean, self-contained vector file (the dark rounded badge plus the icon, extracted directly from
`icon-mockup.html`'s markup, no PNG rasterization involved).

The 9 types are split into two tiers, **basic** (the original four) and **advanced** (the five
newer additions) — see "Basic vs. advanced tiers" below for what that split is for.

**Note on PNG vs. SVG:** the individual per-type icons are plain flat vector shapes, so they're saved
as standalone `.svg` files rather than PNG screenshots. `overview.png` stays a PNG: it's a composite
of several elements (heading, group labels, badges, demo rows with status pills), and a
`foreignObject`-based attempt at making it a real standalone SVG was tried and discarded — the nested
icon `<svg>` elements rendered as blank squares and the page background/font weren't preserved when
the file was opened on its own, so it wasn't reliable enough to ship.

## Design constraints found in the existing app

The app has **no existing icon library or icon usage** anywhere in `src/` (confirmed by search —
the only inline `<svg>` in the whole codebase draws connector lines in the flow diagram, not an
icon). The only established visual language is `StatusBadge.tsx`'s solid-color pill: `border-radius:
12px`, `font-size: 11px`, lowercase text, on the app's dark theme (`--bg: #121212`, `--surface:
#1a1a1a`, `--surface-raised: #212121`, `--text: #e5e5e5`, `--text-dim: #9ca3af`, `--accent:
#d97706`, font `Inter`). Status colors themselves (`STATUS_COLORS`) are muted/dusty mid-saturation
hues, not neon primaries.

So the mockup icons are drawn flat and simple, in muted colors picked to be visually distinct from
the existing status palette (to avoid a type-icon being mistaken for a status color at a glance),
sized small (~24px in a rounded badge, ~15px inline) to match the scale everything else in the app
is drawn at.

## Icon-to-concept mapping chosen for the mockup

| Tier | Type | Icon | Color | Rationale |
|---|---|---|---|---|
| basic | feature | 4-point sparkle/star | `#22a6b3` (teal) | common "something new" glyph, reads clearly at small size |
| basic | bugfix | bug silhouette | `#e5484d` (red) | unambiguous, standard convention (Jira, GitHub labels, etc.) |
| basic | tech-debt | wrench | `#a1662f` (brown/amber) | "maintenance/tooling" association; alternative considered: stacked-coins/layers glyph for "debt," but wrench reads faster at a glance |
| basic | spike | magnifying glass | `#7c6fe0` (violet) | a spike is an investigation, not a time-boxed marker — magnifying glass reads directly as "research/look into this"; alternatives considered: flag (time-boxed marker) or mountain-peak "spike" shape, but neither actually depicts investigation |
| advanced | chore | gear/settings (circle + spokes) | `#8c9c52` (olive) | routine upkeep, distinct from `tech-debt` — this is "nothing's wrong, just needs doing" rather than "we're paying something down"; the spoke pattern reads a little sun-like at 24px, worth a second look before finalizing |
| advanced | docs | document with folded corner + text lines | `#7b93b0` (slate blue-gray) | documentation-only work, no behavior change; this glyph originally matched the plain "story" icon in `plans/story-bug-icons/` (both "paper-ish" concepts) — that icon has since been changed to an open book so the two read as unambiguous, distinct concepts |
| advanced | test | checklist/clipboard with checkmark | `#5cae8a` (muted sage green) | coverage/verification work with no behavior change of its own |
| advanced | security | shield with checkmark | `#9d6fd1` (muted purple) | vulnerability fixes/hardening; shield is the standard convention. Purple isn't the conventional "security = red" color, but red/orange/amber are already crowded by `bugfix`/status colors — the shield glyph carries the meaning, so color just needed an open slot |
| advanced | perf | lightning bolt | `#c9648f` (muted rose) | optimization work where nothing was functionally broken, just slow |

These are mockup choices, not final — easy to swap any single icon/color without touching the
others if review disagrees with one.

## Basic vs. advanced tiers

The 5 newer types are marked **advanced**, the original 4 **basic** — the newer ones are less
frequently needed and more specialized (most teams reach for `feature`/`bugfix`/`tech-debt`/`spike`
day-to-day; `security`/`perf`/etc. are real but rarer categories). This tiering is doing two jobs:

1. **Answers the "9 icons is a lot" concern directly.** More than ~6-7 types starts hurting the whole
   point of an at-a-glance icon — a `<select>` (or custom listbox) with 9 flat options is also just a
   long list to scan every time. Splitting into two groups lets the common case stay fast: a native
   `<select>` can use `<optgroup label="basic">` / `<optgroup label="advanced">` to visually separate
   them with zero extra code (native HTML, no accessibility cost) — see "Creating a subtask: type
   dropdown" below, this is the concrete mechanism the tiering enables there.
2. **A hook for future default-visibility behavior**, if wanted later — e.g. showing only `basic`
   types unless a project/team opts into the advanced set. Not proposed as a requirement here, just
   noting the tier field (see the static config section below) is what such a feature would key off
   of if it's ever wanted.

## Recording the type

No `type` field exists on subtasks today — `data/schema.sql`'s `subtasks` table has `title`,
`comment`, `branch_name`, `status`, `url`, `repo_name`, `complexity_rating`, `release_version`, but
nothing describing what kind of work the subtask is. Following the project's existing pattern for
subtask-level attributes (`complexity_rating` is a plain nullable column, not a lookup table; `status`
is a plain `TEXT` validated against `statusFlow.json` rather than a DB enum/foreign key), the natural
shape is:

- `subtasks.type TEXT` — nullable (so existing rows and the "haven't decided yet" case don't need a
  default), validated app-side rather than via a SQL CHECK constraint (consistent with how `status`
  is handled).
- Mirror the field in `shared/types.d.ts`'s `Subtask` interface as an optional `type?: string | null`.
  With 9 types now (and room to grow), validate against the short names loaded from the static config
  file below rather than hand-writing a 9-member `SubtaskType` union — see "Static config file" —
  the same way `status` is validated against `statusFlow.json`'s states rather than a hardcoded union.
- Threads through the same places `complexityRating` already does: the create/update API payloads in
  `src/api/client.ts`, the corresponding server-side handlers, and `SubtaskRow`'s props.
- No migration framework in this project by design — a new nullable column is added directly to
  `schema.sql`; existing databases pick it up via the same "add the column, `IF NOT EXISTS` guards
  handle fresh installs" convention used elsewhere.

Open question for later: should `type` be required at creation time, or optional/backfillable like
`complexityRating`? Given the backlog note just says "a subtask can be of a given type," optional
(with an "unset" state) is probably the safer default — mirrors how complexity works today, and
avoids forcing a choice on old data.

## Static config file: `static/subtask-types.json` (and `static/story-types.json`)

Ideation only — **no files created under `static/` or anywhere in app code**; draft versions of both
files exist purely for reference at `plans/subtask-type-icons/subtask-types.json` and
`plans/story-bug-icons/story-types.json`.

Rather than hardcoding the 9 types (and their icon/color/tier) as a TypeScript union plus a switch
statement somewhere, define them data-driven in a static JSON file — mirroring the existing
`static/statusFlow.json` convention (statuses/transitions are already config, not code, in this
project) rather than introducing a second, inconsistent way of defining "the set of valid X." Each
entry:

```json
{
  "shortName": "bugfix",
  "fullName": "Bugfix",
  "description": "Fixes incorrect or broken behavior.",
  "iconPath": "static/icons/bug.svg",
  "tier": "basic"
}
```

- `shortName` — the stored/validated value (`subtasks.type`), stable, used in code/URLs/exports.
- `fullName` — the human-readable label (dropdown option text, tooltips).
- `description` — one line, for a tooltip or help text next to the dropdown.
- `iconPath` — where the icon asset lives. Flat under a single `static/icons/<name>.svg` — not
  namespaced per-config (`.../subtask-types/`, `.../story-types/`) — since both draft config files
  ultimately share one icon pool; namespacing by config would make the deliberate sharing described
  next harder to see/enforce, not easier. The real path/format still depends on the hand-drawn-vs-
  `lucide-react` decision below (a `lucide-react` choice would make this a symbolic icon *name*
  rather than a literal file path; worth resolving before finalizing this field's meaning).
- `tier` — `"basic" | "advanced"`, per "Basic vs. advanced tiers" above; drives the `<optgroup>` split
  in the creation dropdown.

**The subtask `bugfix` type and the story `bug` type intentionally point at the same icon file** —
`static/icons/bug.svg` — rather than each config maintaining its own copy. They're the same concept
at different granularities (this subtask fixes a bug / this story reports a bug), so one shared asset
avoids two icons silently drifting apart over time; only the `shortName`/`fullName`/`description`
differ per config, not the glyph. The draft mockups (`plans/subtask-type-icons/bugfix.svg` and
`plans/story-bug-icons/bug.svg`) are still two separate files today, since each `plans/` folder is a
self-contained topic mockup — the shared-file convention is captured in the config `iconPath`s, to be
made physically real (one `static/icons/bug.svg`, not two) whenever this is actually implemented.

`static/story-types.json` follows the identical shape, for the `story`/`bug` distinction from
`plans/story-bug-icons/story-bug-icons.md` (2 entries today: `story`, `bug`) — same fields, same
reasoning, kept as a separate file since it's a different entity (`stories.is_bug`/`kind`, not
`subtasks.type`) with its own independent set of values, not because the shape differs.

This also directly replaces the `SubtaskType` TS union mentioned in "Recording the type" above and in
the implementation steps below — once the config file exists, the union collapses to `string`
validated against the loaded config, the same relationship `SubtaskStatus` has with `statusFlow.json`
today (check `shared/statusCatalog.ts` for the equivalent pattern already used for statuses).

## Creating a subtask: type dropdown

The current "add subtask" form (`src/pages/StoryDetailPage.tsx`, `.add-subtask-form`) is just a title
`<input>` and an "add subtask" `<button>`. Adding type selection at creation time means a dropdown
alongside the title field, where each option shows the type's icon next to its label — matching the
visual language established by the icon mapping table above (e.g. bug icon next to "bugfix").

Worth flagging as a design/implementation constraint: a native HTML `<select>`/`<option>` **cannot
render inline SVG or arbitrary markup inside its options** — browsers only show plain text (and
sometimes a background-image via CSS, but not per-option icons reliably across browsers). So "a
dropdown with icons next to each type" has two real paths:

1. **Native `<select>`, text-only in the closed/open list**, with the icon shown separately — e.g. a
   small icon preview next to the select that updates as the user picks a type. Simple, fully
   accessible, keyboard-native, but the dropdown *itself* doesn't show icons while open.
2. **Custom listbox component** (a button that opens a small popover/menu of options, each row
   rendering `<Icon /> label`), styled to look like a dropdown. Matches the "icon next to each type
   in the list" requirement literally, but is more code — needs its own keyboard handling, click-outside-to-close,
   and ARIA listbox roles to stay accessible, since it's not a native form control.

Given the app has no existing custom-dropdown precedent (the only `<select>` in the codebase today is
`SubtaskRow`'s plain-text complexity picker), option 2 would be a new UI pattern for this project —
worth deciding deliberately rather than defaulting into it. Recommendation for a first cut: start
with option 1 (native select, icon preview alongside it) since it's a few lines of code and no new
accessibility surface, and only build the custom listbox if review specifically wants icons visible
inside the open dropdown.

With 9 types, the native `<select>` should use `<optgroup label="basic">` / `<optgroup
label="advanced">` (populated from each entry's `tier` in the static config file) rather than one flat
list of 9 — free with native `<select>`, no extra component code, and keeps the common 4 types
scannable without scrolling past the rarer 5.

Either way, the type picker sits next to the title input in `.add-subtask-form`, and a `type` value
gets included in the `api.createSubtask(storyId, { title, type })` call alongside the existing title.

## Implementation recommendation: adopt an icon library, don't hand-maintain SVGs

The mockup icons here are hand-drawn inline SVG paths (rendered to PNG via a throwaway Playwright
script for review purposes only — not meant to be copied into the app as-is). For actual
implementation, recommend adding **`lucide-react`** (MIT-licensed, tree-shakeable, no other
dependencies, pairs naturally with a React+Vite app) rather than committing hand-maintained SVG
path data:

- `lucide-react`'s `Sparkles`, `Bug`, `Wrench`, `Search`, `Settings`, `FileText`, `ClipboardCheck`,
  `ShieldCheck`, and `Zap` icons map directly to the 9 concepts above with no custom maintenance
  burden.
- Tree-shaking means bundle size only grows by the ~9 icons actually imported, not the whole set.
- This is a new dependency (project currently has zero icon-library dependencies), which is worth
  weighing against a fully custom/hand-drawn SVG approach if minimizing dependencies matters more
  than maintenance ease — nine hand-maintained icon path strings is more upkeep than the original
  four, tipping the balance further toward lucide as the lower-effort path.

If a no-new-dependency constraint is preferred instead, the mockup's hand-drawn SVG paths are saved
as-is in `plans/subtask-type-icons/icon-mockup.html` (the exact source used to render the PNGs above)
and could be lifted directly into a small `src/components/SubtaskTypeIcon.tsx`, following the same
"flat SVG, `currentColor`/explicit fill, ~24px viewBox" shape used there.

## Where the icon would actually render (once a `type` field exists)

Confirmed there's no `type` field in the data model yet (see "Recording the type" above). Confirmed
`SubtaskRow.tsx`'s actual current layout, which changes where "top-left of the card" lands:

- The card (`.subtask-row`) currently opens with a `.subtask-header` row: `.subtask-branch-pr` (branch
  name + PR link) on the left, `.status-flow` (current `StatusBadge` + allowed next transitions) on
  the right. Below that, on transition, a `.release-version-prompt`; then `.subtask-footer` with the
  subtask title and complexity picker.
- Per this task's brief, the type icon goes **top-left of the card** — i.e. the very corner of
  `.subtask-row`, ahead of `.subtask-branch-pr`. Two ways to place it:
  1. **Inline, inside `.subtask-header`**: prepend the icon to `.subtask-branch-pr`, so it sits
     directly left of the branch name, same row, same baseline. Simplest change, no new positioning
     context needed.
  2. **Corner badge, absolutely positioned over `.subtask-row`**: a small icon pinned to the card's
     top-left corner (e.g. `position: absolute; top: -6px; left: -6px` on a wrapper, or an inset badge
     sitting just inside the card border), independent of the header row's flex layout. Reads more
     like a "tag" on the card itself rather than a piece of header content — closer to `overview.png`'s
     mockup framing, but needs `.subtask-row` to be a positioning context (`position: relative`,
     already implicit as a block container — would need explicit `position: relative` added) and a bit
     more CSS care to avoid overlapping the branch/PR text on narrow widths.

  Leaning toward option 2 for a true "corner badge" look consistent with "top-left of each subtask
  card" as stated, but this is worth eyeballing both ways against the mockup PNGs before committing —
  not decided here.
- Possibly `src/components/subtasks/SubtaskFlowDiagram.tsx` / `SubtaskTransitionsTable.tsx` if type
  should be visible in those views too — not mocked up here, lower priority.

## Suggested implementation steps (when picked up)

1. Create the real `static/subtask-types.json` (and `static/story-types.json`) from the draft files
   linked in "Static config file" above; settle the `iconPath` field's actual meaning (file path vs.
   `lucide-react` icon name) as part of this step.
2. Add the `type` field per "Recording the type" above: nullable `TEXT` column on `subtasks` in
   `data/schema.sql`, optional `type?: string | null` in `shared/types.d.ts`, validated app-side
   against `static/subtask-types.json`'s short names; threaded through `src/api/client.ts` and the
   server-side subtask create/update handlers.
3. Decide hand-drawn vs. `lucide-react` per the tradeoff above; get sign-off on the 9 icon/color
   choices (or adjust — these are mockup defaults, not final).
4. Add a small `SubtaskTypeIcon` (or equivalent) component, driven by the config file rather than a
   hardcoded switch statement.
5. Add the type dropdown to `.add-subtask-form` in `src/pages/StoryDetailPage.tsx` per "Creating a
   subtask: type dropdown" above (native `<select>` with `<optgroup>`s by tier + icon preview as the
   first cut).
6. Wire `SubtaskTypeIcon` into `SubtaskRow.tsx`'s top-left corner, per whichever placement option is
   chosen above.
7. Update relevant tests (`SubtaskRow.test.tsx` if present) and the PDF/export rendering
   (`src/utils/pdfExport.ts`) if subtask type should also appear there.
