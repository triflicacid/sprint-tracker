- Past sprints are locked and cannot be edited
- subtask transition history - include dates below arrows. Include table of transitions too below the flow chart.
- `/transitions` - all as SVG and separated arrows so they are legible
- Code: avoid amending the URL if possible, use internal state
- A subtask can be of a given type - feature, bugfix, tech-debt, spike
- Auto-generate subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g., `tech-debt/NEB-1234-my-title-here` (this is auto-filled in the textbox and highlighted, so can be replaced by the user)[sprint-export-2026-07-05.md](../../../Downloads/sprint-export-2026-07-05.md)
- Subtasks: comment below tile.

## Bugs
- Stats: assume latest is NEW, even when status is not NEW. No transition for it, but should be deducible.