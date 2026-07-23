# Plan: sprint project field with autocomplete

Status: **not started**. Plan only, no code changes yet.

Goal: add an optional 'project' field to sprints that auto-populates from the last sprint and provides an autocomplete dropdown of previous project names.

## Current state

- The `sprints` table in `data/schema.sql` has fields for `name`, `start_date`, `end_date`, `comment`, but no project field.
- `SprintSummary` and `SprintDetail` types in `shared/types.d.ts` do not include a project field.
- Sprint creation form in `src/pages/SprintListPage.tsx` has basic text inputs with no autocomplete functionality.
- `server/services/sprintService.ts` already auto-closes the previous sprint by setting its `end_date` when creating a new sprint.
- No reusable autocomplete/combobox component exists in the UI component library.

## Scope

- Add an optional `project` text field to sprints (e.g., "Quick T-Plan", "market grid").
- When creating a new sprint, auto-populate the project field from the most recent sprint's project value.
- Provide a searchable dropdown showing all distinct project names from previous sprints.
- Build a reusable `SearchableInput` component that combines freeform text entry with filtered suggestion list.
- Keep project field optional and non-validated - any text is allowed.

## Use cases

1. **Project continuity**: User creates sprint "Sprint 43" for project "market grid" → next sprint auto-fills "market grid" for convenience.
2. **Project switching**: User starts typing "Quick" and sees "Quick T-Plan" in suggestions → can select it instead of retyping.
3. **New project**: User types a new project name that doesn't exist in history → allowed, no validation required.
4. **Empty project**: User can leave project blank → no requirement to fill it.

## Data model

- Add `project TEXT` to the `sprints` table in `data/schema.sql`:
  - nullable, no default value
  - no foreign key or constraint - just freeform text
  - placed after `comment` field for logical grouping
- Update migration: existing local databases can be reset/reseeded during development as needed.
- No separate projects table needed since there's no metadata, just historical values.

## API and backend plan

1. Extend `SprintRow` interface in `server/services/sprintService.ts`:
   - add `project: string | null`
2. Update `CreateSprintInput`:
   - add `project?: string | null`
3. Modify `rowToSummary` function:
   - include `project: row.project` in returned summary
4. Update `createSprint` function:
   - accept `project` from input
   - retrieve `project` value from previous sprint when auto-populating form (note: backend returns previous sprint data, frontend uses it)
   - persist `project` in INSERT statement
5. Update `updateSprint` function:
   - allow updating the `project` field
6. Add new helper function `getDistinctProjects()`:
   - returns `string[]` of unique non-null project values ordered by most recent usage
   - query: `SELECT DISTINCT project FROM sprints WHERE project IS NOT NULL AND project != '' ORDER BY MAX(id) DESC`
   - used for autocomplete dropdown data
7. Add route in `server/routes/sprints.ts`:
   - `GET /api/sprints/projects` - returns list of distinct project names

## Shared types

- Update `SprintSummary` in `shared/types.d.ts`:
  - add `project: string | null`
- `SprintDetail` inherits from `SprintSummary`, so automatically includes project.

## API client

- Update `src/api/client.ts`:
  - add `project` field to sprint creation payload
  - add `listSprintProjects(): Promise<string[]>` function for fetching distinct projects

## UI component: SearchableInput

Create a new reusable component at `src/components/SearchableInput.tsx`.

**Features:**
- Accepts `initialValue` prop to set the starting input value.
- Accepts `suggestions: string[]` prop with available options.
- Always shows filtered suggestions when there are matching substrings (not just when empty).
- Filters suggestions by substring match (case-insensitive) as user types.
- Shows all suggestions when input is empty and focused.
- Accepts `onClick: (value: string) => void` callback that fires when a suggestion is clicked.
- Accepts `onChange: (value: string) => void` callback that fires when the user types or input changes.
- The `onClick` handler receives the clicked option and should update the input's content.
- The `onChange` handler receives the current input value on every change.
- Clicking outside closes the dropdown.
- Supports keyboard navigation (arrow keys to navigate suggestions, Enter to select, Escape to close).
- Renders as a standard text input with a positioned dropdown list below.
- Styling matches existing form inputs and dropdown patterns in the app.

**Props interface:**
```typescript
interface SearchableInputProps {
  initialValue: string;
  onClick: (value: string) => void;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}
```

**Implementation notes:**
- Use `useState` for managing internal input value, dropdown open/close, and selected index.
- Initialize internal value state from `initialValue` prop.
- Use `useEffect` with click-outside detection (similar to existing dropdown patterns).
- On input change: update internal state and call `onChange(newValue)` to notify parent.
- Filter suggestions: `suggestions.filter(s => s.toLowerCase().includes(currentValue.toLowerCase()))`.
- When a suggestion is clicked or selected via Enter:
  - Update internal input value to the selected value.
  - Call `onChange(selectedValue)` to notify parent of the change.
  - Call `onClick(selectedValue)` to notify parent of the selection action.
  - Close the dropdown.
- Dropdown positioned absolutely relative to input container.
- Include CSS file `SearchableInput.css` for styling.

## Frontend plan

1. Create `src/components/SearchableInput.tsx` and `SearchableInput.css`:
   - implement as described above
   - include focus/blur handling
   - ensure accessibility (aria attributes for screen readers)
2. Update `src/pages/SprintListPage.tsx`:
   - add state for `project` field: `const [project, setProject] = useState<string>("")`
   - add state for project suggestions: `const [projectSuggestions, setProjectSuggestions] = useState<string[]>([])`
   - fetch project suggestions on mount via `api.listSprintProjects()`
   - when "new sprint" button is clicked and form opens:
     - fetch the most recent sprint (first item in `sprints` list)
     - auto-populate `project` with that sprint's project value (if exists)
   - in form rendering:
     - replace plain text input with `<SearchableInput>` for project field
     - pass `initialValue={project}`, `onChange={setProject}`, `onClick={setProject}`, `suggestions={projectSuggestions}`
     - note: `onChange` updates state as user types, `onClick` fires when selecting from dropdown
   - in `handleCreateSprint`:
     - include `project: project.trim() || undefined` in API call
     - clear project field after creation: `setProject("")`
3. Update `src/pages/SprintDetailPage.tsx` (if sprint editing exists):
   - display project field in sprint metadata
   - allow editing with same searchable input component if edit form exists
   - (note: check if sprint edit UI exists first; if not, defer to future work)

## Backend routes summary

- `POST /api/sprints` - extend to accept `project` in request body
- `PATCH /api/sprints/:id` - extend to allow updating `project`
- `GET /api/sprints/projects` - new endpoint returning distinct project names

## Tests

### Backend tests (`server/services/sprintService.test.ts`):
- Creating sprint with project persists the value correctly.
- Creating sprint without project leaves it null.
- Updating sprint project modifies the value.
- `getDistinctProjects()` returns unique projects ordered by most recent.
- `getDistinctProjects()` excludes null and empty string values.

### Integration tests (route level):
- `GET /api/sprints/projects` returns array of strings.
- Creating sprint via `POST /api/sprints` with `project` field works.
- Retrieving sprint via `GET /api/sprints/:id` includes project field.

### Frontend component tests (`src/components/SearchableInput.test.tsx`):
- Renders input with provided initial value.
- Typing updates the input value and calls onChange with new value.
- Shows all suggestions when focused and input empty.
- Filters suggestions based on input text (substring matching).
- Shows filtered suggestions even when input is not empty (as long as matches exist).
- Clicking suggestion calls both onChange and onClick with the selected value.
- Clicking suggestion updates input value.
- Clicking suggestion closes dropdown.
- Escape key closes dropdown.
- Arrow keys navigate suggestions.
- Enter key selects highlighted suggestion, calls both onChange and onClick.

### Frontend page tests (optional, if test coverage exists):
- Sprint creation form includes project field.
- Project field auto-populates from previous sprint.
- Selecting a project suggestion updates the input.

## Edge cases and considerations

1. **Empty project list**: If no sprints have projects yet, suggestions list is empty - autocomplete still works as freeform input.
2. **Duplicate projects**: Same project name used across multiple sprints - query returns it once.
3. **Case sensitivity**: Filtering is case-insensitive for better UX.
4. **Long project names**: Consider max-width and text overflow in both input and dropdown items.
5. **Concurrent sprints**: If app ever supports overlapping sprints, "most recent" is based on ID/creation order, not dates.
6. **Migration of existing data**: Existing sprints will have `project = NULL` after migration - no backfill needed.

## Suggested implementation steps

1. **Database schema**:
   - Add `project TEXT` column to `sprints` table in `data/schema.sql`.
   - Reset/reseed local database with updated schema.
2. **Backend service layer**:
   - Update `SprintRow`, `CreateSprintInput` interfaces with `project` field.
   - Modify `rowToSummary`, `createSprint`, `updateSprint` to handle project.
   - Add `getDistinctProjects()` function with SQL query.
3. **Backend routes**:
   - Update `POST /api/sprints` and `PATCH /api/sprints/:id` handlers to accept project.
   - Add `GET /api/sprints/projects` route calling `getDistinctProjects()`.
4. **Shared types**:
   - Add `project: string | null` to `SprintSummary`.
5. **API client**:
   - Add `listSprintProjects()` function.
   - Update `createSprint` payload type to include project.
6. **SearchableInput component**:
   - Create component file, CSS, and basic test file.
   - Implement component with internal value state initialized from `initialValue`.
   - Implement suggestion filtering that always shows matches when typing.
   - Implement dropdown positioning and styling.
   - Implement `onChange` callback that fires on every input change.
   - Implement `onClick` callback that fires when selecting from dropdown (also calls onChange).
   - Implement keyboard navigation and click-outside handling.
7. **Sprint creation form**:
   - Update `SprintListPage.tsx` to use `SearchableInput`.
   - Fetch project suggestions on mount.
   - Auto-populate project from last sprint when form opens.
   - Wire up onChange handler to update project state on typing.
   - Wire up onClick handler to update project state on selection.
   - Wire up create handler to include project.
8. **Manual testing**:
   - Create sprints with different projects.
   - Verify searchable suggestions update.
   - Verify new sprint auto-populates previous project.
   - Type partial text and verify filtered suggestions appear.
   - Click a suggestion and verify input updates.
   - Test keyboard navigation and selection.
   - Test creating sprint with new project name.
   - Test leaving project blank.
9. **Automated tests**:
   - Add backend unit tests for service functions.
   - Add component test for `SearchableInput`.
   - Add integration test for new API endpoint.

## UI/UX considerations

- **Visual consistency**: Searchable dropdown should match existing dropdown styling (e.g., similar to status transition dropdowns if they exist).
- **Placeholder text**: Use "project (optional)" or "project name" to indicate the field's purpose.
- **Loading state**: If fetching suggestions is slow, consider a loading indicator (likely not needed for local DB).
- **Accessibility**: Include proper ARIA labels (`role="combobox"`, `aria-expanded`, `aria-autocomplete`).
- **Mobile/tablet**: Ensure dropdown is usable on touch devices (sufficient tap target size).
- **Always show matches**: Dropdown appears whenever there are matching suggestions, not just on empty input.

## Out of scope (future considerations)

- **Project metadata**: No additional project fields (description, dates, color-coding) in this iteration.
- **Project management page**: No dedicated page for viewing/managing projects - they're just tags on sprints.
- **Project filtering**: No filtering sprint list by project in this iteration (could be added later).
- **Project analytics**: No stats aggregation by project in this iteration.
- **Project validation**: No enforcement of project naming conventions or required format.
- **Recent projects limit**: Show all distinct projects - no limit in this iteration (can add later if performance becomes an issue).

## Verification

- Creating a new sprint auto-fills the project field with the last sprint's project value.
- Clicking on the project input shows a dropdown list of all previous project names.
- Typing in the project input filters the dropdown to matching suggestions (substring match).
- Filtered suggestions appear even when input is not empty.
- Clicking a suggestion from the dropdown populates the input with that value and closes dropdown.
- Selecting a suggestion via Enter key populates the input and closes dropdown.
- Creating a sprint with a new project name (not in suggestions) works correctly.
- The project field is visible in sprint detail pages and sprint cards (if applicable).
- Leaving project blank when creating a sprint is allowed and persists as null.
- SearchableInput component is keyboard-navigable and accessible.

