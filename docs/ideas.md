## New Features

- A subtask can be of a given type - feature, bugfix, tech-debt, spike. Add icons for each
- Auto-generate subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g., `tech-debt/NEB-1234-my-title-here` (this is auto-filled in the textbox and highlighted, so can be replaced by the user)[sprint-export-2026-07-05.md](../../../Downloads/sprint-export-2026-07-05.md)
- Past sprints are locked and cannot be edited
- [?] Bundle installer/single exe for electron?

## Enhancements

- `/transitions` - all as SVG and separated arrows so they are legible. Some arrows can be a straight line between lozenges if 1. they are next to one-another and 2. there isn't al;ready a straight connection (avoid overlap)
- Subtasks: comment below tile.
- Stats: time per story, only show numbers, e.g., NEB-1234, on y-axis
- Subtask transition history: show only states in history, with an arrow forming a chain. For exampke, NEW -> WIP -> IN REVIEW -> PR COMMENTS -> IN REVIEW -> CUT RELEASE .... Like the export, also make a table below it with thew new state, date entered, and time elapsed in previuous state before arriving in this one (for NEW, the first row, this will be empty)

## Tech Debt
- Code: avoid amending the URL if possible, use internal state
- [?] Add code auto-formatter to project

## Bugs
- Stats: assume latest is NEW, even when status is not NEW. No transition for it, but should be deducible.