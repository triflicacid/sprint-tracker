## New Features

- A subtask can be of a given type - feature, bugfix, tech-debt, spike. Add icons for each
- Auto-generate subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g., `tech-debt/NEB-1234-my-title-here` (this is auto-filled in the textbox and highlighted, so can be replaced by the user)[sprint-export-2026-07-05.md](../../../Downloads/sprint-export-2026-07-05.md)
- Past sprints are locked and cannot be edited

## Enhancements

- `/transitions` - all as SVG and separated arrows so they are legible. Some arrows can be a straight line between lozenges if 1. they are next to one-another and 2. there isn't al;ready a straight connection (avoid overlap)
- Subtasks: comment below tile.
- Stats: time per story, only show numbers, e.g., NEB-1234, on y-axis
- subtask transition history - include dates below arrows. Include table of transitions too below the flow chart.

## Tech Debt
- Code: avoid amending the URL if possible, use internal state

## Bugs
- Stats: assume latest is NEW, even when status is not NEW. No transition for it, but should be deducible.