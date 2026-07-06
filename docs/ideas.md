## New Features

- A subtask can be of a given type - feature, bugfix, tech-debt, spike. Add icons for each
- Auto-generate subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g., `tech-debt/NEB-1234-my-title-here` (this is autofilled in the textbox and highlighted, so can be replaced by the user)[sprint-export-2026-07-05.md](../../../Downloads/sprint-export-2026-07-05.md)
- [?] Bundle installer/single exe for electron?

## Enhancements

- `/transitions` - all as SVG and separated arrows so they are legible. Some arrows can be a straight line between lozenges if 1. they are next to one-another and 2. there isn't al;ready a straight connection (avoid overlap)
- Subtasks: comment below tile.
- Stats: time per story, only show numbers, e.g., NEB-1234, on y-axis
- Subtask transition history: show only states in history, with an arrow forming a chain. For example, NEW -> WIP -> IN REVIEW -> PR COMMENTS -> IN REVIEW -> CUT RELEASE .... Like the export, also make a table below it with thew new state, date entered, and time elapsed in previuous state before arriving in this one (for NEW, the first row, this will be empty)
- Past sprints are locked and cannot be edited
- Cannot change complexity of work once it is past CUT_RELEASE. As statuses are data-driven, include this as a flag or something in statusFlow.json.
- Exporting an entire sprint grants one page to each sub-task. Add an export button on the subtask's page to export just that subtask.

## Tech Debt
- Code: avoid amending the URL if possible, use internal state
- [?] Add code auto-formatter to project
- There are several identical functions duplicated in FE/BE. As `@shared/*` exists, we can move them here. Example: load statuses and append JIRA_ONLY and WORK_REMAINING.
- globalo.css is getting pretty beefy. Split styles up by components, pages etc. (question: store in code next to the component, or in styles/?)

## Bugs
- Stats: assume latest is NEW, even when status is not NEW. No transition for it, but should be deducible.
- Investigate: handling multiple transitions in one day, how does the calendar view in subtasks/:id handle this?