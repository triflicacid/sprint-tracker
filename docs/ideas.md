## New Features

- A subtask can be of a given type - feature, bugfix, tech-debt, spike. Add icons for each
- Auto-generate subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g., `tech-debt/NEB-1234-my-title-here` (this is autofilled in the textbox and highlighted, so can be replaced by the user)[sprint-export-2026-07-05.md](../../../Downloads/sprint-export-2026-07-05.md)
- [?] Bundle installer/single exe for electron?

## Enhancements

- `/transitions` - all as SVG and separated arrows so they are legible. Some arrows can be a straight line between lozenges if 1. they are next to one-another and 2. there isn't al;ready a straight connection (avoid overlap)
- Subtasks: comment below tile.
- Stats: time per story, only show numbers, e.g., NEB-1234, on y-axis
- Past sprints are locked and cannot be edited
- Exporting an entire sprint grants one page to each sub-task. Add an export button on the subtask's page to export just that subtask.

## Tech Debt
- Code: avoid amending the URL if possible, use internal state
- [?] Add code auto-formatter to project
- There are several identical functions duplicated in FE/BE. As `@shared/*` exists, we can move them here. Example: load statuses and append JIRA_ONLY and WORK_REMAINING.
- global.css is getting pretty beefy. Split styles up by components, pages etc. (question: store in code next to the component, or in styles/?)

## Bugs
