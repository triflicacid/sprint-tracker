# Plan: collapsible sections on the export page

Status: **not started** (2026-07-21)

## Context

`ExportPage.tsx` currently has two top-level `<h2>` sections:

- **Sprints** — a date-range row + a scrollable sprint checkbox list (can get very long)
- **Fields to include** — two `<h3>` sub-groups (Story / Subtask) with checkbox lists

As more export options accumulate the page gets tall and hard to scan. Giving each section a
collapse toggle lets users focus on whatever they still need to configure while keeping the rest
out of the way.

No other page currently has a collapsible section UI, so a small shared component is the right
call — it's likely to be reused (stats page, timesheet, etc.) and keeps the toggle logic out of
`ExportPage` itself.

## Desired behaviour

- Every section is **open by default**; its chevron points **down** (▾).
- Clicking the section **title row** (title text or chevron) toggles the section.
- When collapsed the chevron points **right** (▸) and the section body is replaced by a single
  horizontal rule drawn flush to the left of the content area, directly below the title row.
- The chevron rotation is a CSS transition (not an instant flip) — ~150 ms ease feels snappy
  without being distracting.
- Collapsed/expanded state is **ephemeral** (not persisted to `localStorage`). If the user
  navigates away and back, every section opens again. (The fields checkboxes are already
  persisted via `exportFields`; this is a purely visual affordance.)

## Component design

### `CollapsibleSection`

New file: `src/components/CollapsibleSection.tsx` + `CollapsibleSection.css`.

```tsx
interface CollapsibleSectionProps {
    title: string;                  // rendered in the heading
    headingLevel?: "h2" | "h3";    // defaults to "h2"
    defaultOpen?: boolean;          // defaults to true
    children: React.ReactNode;
}
```

Internals:

- One `useState<boolean>` for `isOpen`, initialised from `defaultOpen ?? true`.
- The "title row" is a `<button>` (reset-styled, full-width, `display: flex`,
  `align-items: center`) wrapping a chevron `<span>` and a heading element. Using a `<button>`
  instead of an `onClick` on the `<h2>` preserves native keyboard access (Enter / Space) at zero
  extra cost.
- The chevron is a tiny inline SVG (~16 × 16 px, a simple right-pointing path) inside a `<span>`
  with class `.collapsible-chevron`. When `isOpen` is `false` the span also gets the `.closed`
  class. The span has `transition: transform 150ms ease`. The default (open) state applies
  `rotate(90deg)` so the SVG points down; the `.closed` state removes the rotation so it points
  right — one CSS rule covers both directions.
- Below the button: when `isOpen` is `true`, render `{children}`; when `false`, render an
  `<hr className="section-collapsed-rule" />`. The `<hr>` replaces the body entirely — no
  `display: none` / `overflow: hidden` / animated height. A clean horizontal line keeps the
  page's vertical rhythm legible without the complexity of animating an unknown natural height.

### CSS (`CollapsibleSection.css`)

```css
.collapsible-section-trigger {
    all: unset;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    width: 100%;
}

.collapsible-section-trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
}

.collapsible-chevron {
    display: flex;
    align-items: center;
    transition: transform 150ms ease;
    transform: rotate(90deg);   /* open default: SVG points right, rotated to point down */
    color: var(--text-dim);
    flex-shrink: 0;
}

.collapsible-chevron.closed {
    transform: rotate(0deg);    /* collapsed: SVG points right */
}

.section-collapsed-rule {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0;
}
```

## Changes to `ExportPage.tsx`

Replace each bare `<h2>…</h2>` + following content block with
`<CollapsibleSection title="…">…</CollapsibleSection>`.

**Sprints section — before:**
```tsx
<h2>Sprints</h2>
<div className="export-date-range">…</div>
<div className="export-sprint-list">…</div>
```

**Sprints section — after:**
```tsx
<CollapsibleSection title="Sprints">
    <div className="export-date-range">…</div>
    <div className="export-sprint-list">…</div>
</CollapsibleSection>
```

**Fields section — before:**
```tsx
<h2>Fields to include</h2>
<div className="export-fields">…</div>
<button onClick={resetToDefaults}>reset to defaults</button>
```

**Fields section — after:**
```tsx
<CollapsibleSection title="Fields to include">
    <div className="export-fields">…</div>
    <button onClick={resetToDefaults}>reset to defaults</button>
</CollapsibleSection>
```

The inner `<h3>Story</h3>` / `<h3>Subtask</h3>` headings inside `.export-field-group` are
_not_ wrapped — they are group labels, not independent collapsible sections. If that changes
later, `CollapsibleSection` already accepts `headingLevel="h3"`.

## Design decisions

- **`<button>` not `<div onClick>`** — a `<button>` is the correct semantic element for an
  interactive trigger. A plain `<div>` needs manual `role="button"`, `tabIndex`, and `onKeyDown`
  to be keyboard-accessible; `<button>` gives all of that for free.
- **`all: unset` on the button** — the cleanest way to strip native button styles without
  fighting each property individually; safe here since every needed property is explicitly added
  back.
- **Rotate from 90° → 0°, not 0° → 90°** — the open default is `rotate(90deg)` so a single
  `.closed` class (setting `rotate(0deg)`) handles the collapsed state. The alternative
  (`rotate(0deg)` open, `rotate(-90deg)` closed) would require adding a class on the open state
  too, meaning two class name changes per toggle instead of one.
- **No `<details>`/`<summary>`** — native disclosure elements animate oddly in current Chromium
  (used by Electron), the marker is difficult to style predictably, and there is no controlled
  `open` prop for React state. A manual `useState` toggle is three lines and avoids the
  quirkiness.
- **No height animation** — CSS `height` transitions require either a large `max-height` guess
  (causes sluggish or clipped animations) or a `ResizeObserver` to read the natural height first
  (adds real complexity). An instant show/hide with a clean `<hr>` is less visually busy and
  more robust, matching the project's existing functional aesthetic.
- **Ephemeral state** — section open/closed state is not persisted. The export fields themselves
  are already persisted (existing `saveExportFields` / `loadExportFields`); adding section
  collapse state on top would be disproportionate and could leave the page looking empty on
  first visit.

## Implementation steps

1. `src/components/CollapsibleSection.tsx` — new component (see spec above).
2. `src/components/CollapsibleSection.css` — CSS (see spec above).
3. `src/pages/ExportPage.tsx` — import `CollapsibleSection`; wrap the two `<h2>` sections as
   shown above; remove the bare `<h2>` tags (the component renders the heading element
   internally).

Three file touches. No backend changes, no new dependencies, no schema changes.

## Verification

- Open the export page; confirm both sections are expanded and both chevrons point down.
- Click the "Sprints" title row; confirm the sprint list and date-range row disappear, a
  horizontal rule appears in their place, and the chevron points right.
- Click again; confirm the section re-expands and the chevron rotates back down.
- Repeat for "Fields to include".
- Tab to each title button; confirm a focus ring appears and Enter / Space toggles the section.
- Navigate away (e.g. back to sprints list) and return; confirm both sections are open again.

