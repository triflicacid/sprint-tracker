## New Features

- A subtask can be of a given type - feature, bugfix, tech-debt, spike. Add icons for each
- Auto-generate subtask's branch name based of subtask name (all lowercase and spaces are dashes), name is e.g., `tech-debt/NEB-1234-my-title-here` (this is autofilled in the textbox and highlighted, so can be replaced by the user)
- [?] Bundle installer/single exe for electron?
- `/stats/:id` - create a sprint burndown, as well as velocity data
- `/stats` - while allowing to select a sprint, provide coss-sprint stats like velocity and #subtasks across sprints and repos

## Enhancements

- `/transitions` - all as SVG and separated arrows so they are legible. Some arrows can be a straight line between lozenges if 1. they are next to one-another and 2. there isn't al;ready a straight connection (avoid overlap)
- Past sprints are locked and cannot be edited
- Remove ability to add/remove holidays on a sprint's state page. For adding holiday, as well as adding a selected date on the story page, add a popup calendar which you can select days like how you can currently on the stats page.

## Tech Debt
- [?] Add code auto-formatter to project

## Bugs
- `jira_labels` is a TEXT, shall we use tags for this instead of a separate field