# Plan: global search across sprints, stories, and subtasks

Status: **not started**.

Goal: add a global search page with real-time cross-entity search and flexible filtering options to
restore the searchability that existed when all data was in a single markdown file.

## Current state

- The app stores all data in SQLite (`data/sprint-tracker.sqlite3`).
- Export feature (`/export`) generates markdown files but requires manual download and external search.
- No in-app search capability exists.
- Navigation requires knowing the sprint → story → subtask hierarchy.
- Users cannot easily find information across entities (e.g., "which subtasks mention 'authentication'?").

## Scope

- Add a dedicated search page accessible from main navigation.
- Search across sprints, stories, and subtasks with a single query input.
- Filter by entity type(s): all, sprints only, stories only, subtasks only.
- Filter by parent story (search within a specific story's subtasks).
- Filter by subtask type (feature, bugfix, tech-debt, etc.).
- Filter by one or more internal story tags using a separate multi-select input with removable lozenges.
- Search all history, including completed and locked sprints; do not silently restrict results to the
  current sprint.
- Display results as cards with relevant context. Matched-text highlighting is deferred.
- Link each result to its detail page.
- Support case-insensitive partial matching.

## User experience

### Navigation
- Add a search icon/link in the main app navigation (alongside sprints, export, stats, etc.).
- Route: `/search`.
- Optional: support keyboard shortcut (Ctrl+K / Cmd+K) to open search.

### Search interface
```
┌────────────────────────────────────────────────────────────┐
│  Search                                                     │
├────────────────────────────────────────────────────────────┤
│  [_________________ search query _____________________] 🔍  │
│  Tags: [search internal tags...]                           │
│          [backend ×] [security ×]                          │
│                                                             │
│  Filters:                                                   │
│  [ ] Sprints  [ ] Stories  [ ] Subtasks                    │
│  (if none checked, search all)                             │
│                                                             │
│  Advanced filters:                                          │
│  Within story: [dropdown: All stories / Story dropdown]     │
│  Subtask type: [dropdown: All types / type dropdown]        │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  Results (42 matches)                                       │
│                                                             │
│  Sprints (3)                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Sprint 5: Q2 Platform Work                           │  │
│  │ May 1 – May 14                                        │  │
│  │ comment: Focus on authentication improvements        │  │
│  │ [view sprint →]                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Stories (12)                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PROJ-123: User authentication flow                  │  │
│  │ Sprint: Q2 Platform Work                              │  │
│  │ Status: DONE · Tags: backend, security                │  │
│  │ [view story →]                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Subtasks (27)                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Add JWT authentication middleware                    │  │
│  │ Story: PROJ-123 · Status: DONE · Type: feature        │  │
│  │ Branch: auth-middleware · Complexity: 3               │  │
│  │ comment: Implemented token validation and refresh     │  │
│  │         logic with authentication service             │  │
│  │ [view subtask →]                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Internal tag filter
- Provide a separate internal-tag input in addition to the free-text query input. JIRA labels are not
  used by this control; they remain searchable text within the main query.
- Populate suggestions using the existing `GET /api/tags` endpoint and `api.listTags()`. Do not allow
  arbitrary new tags to be created from the search page.
- Selecting a suggestion adds its `Tag` as a removable lozenge. Each selected tag can be removed using its
  lozenge's remove control, following the interaction and styling used for tags on the story details
  page (`StoryDetailPage` and `src/components/stories/story-tags.css`). This filter must not add or remove
  tags from any story.
- Store and submit selected tag IDs rather than names so filtering remains unambiguous.
- Multiple selected tags use AND semantics: a story must have every selected internal tag.
- When text and tags are both supplied, they use AND semantics for stories and subtasks: textual fields
  must match the query and the story must have every selected tag. Sprint results continue to use the
  text query because internal tags do not apply to sprints.
- Tags constrain story results and subtask results through the subtask's parent story. Sprint results
  are not inferred from tags. For a tags-only search, return matching stories and their subtasks,
  but no sprint results.
- Permit a tags-only search without requiring a text query. Require at least one criterion: a text
  query of at least two characters or one selected tag.
- Keep the text query and selected tags when entity, story, or subtask-type filters change.

### Empty states
- No criteria entered: show placeholder with search tips.
- No results: show a message that reflects the supplied text and/or tags and suggests adjusting the
  query or filters.

## Data model

No schema changes required. Search operates on existing tables:
- `sprints`: `name`, `comment`, `project`
- `stories`: `description`, `jira_key`, `jira_title`, and each textual value in `jira_labels`
- `subtasks`: `title`, `comment`, `branch_name`, `repo_name`, `release_version`
- `tags` / `entity_tags`: selected internal tags filter stories and their subtasks separately from the
  free-text query

## API design

### Search endpoint

```
GET /api/search?q={query}&tagId={id}&tagId={id}&entities={types}&storyId={id}&subtaskType={type}
```

**Query parameters:**
- `q` (optional when at least one `tagId` is supplied): search query string (min 2 chars); includes partial
  text matching against JIRA labels
- `tagId` (optional, repeatable): internal story tag ID; multiple tags use AND semantics
- `entities` (optional): comma-separated list of `sprint`, `story`, `subtask` (default: all)
- `storyId` (optional): filter subtasks by parent story ID
- `subtaskType` (optional): filter subtasks by type (feature, bugfix, etc.)

Reject requests with no text query and no tag IDs. Validate that every `tagId` is a positive integer and
refers to an existing internal tag. The frontend obtains available tags from the existing `GET /api/tags`
endpoint; no search-specific catalogue endpoint is required.

**Response:**
```typescript
{
  sprints: SearchResultSprint[],
  stories: SearchResultStory[],
  subtasks: SearchResultSubtask[]
}
```

**Result types:**
```typescript
interface SearchResultSprint {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  comment: string | null;
  project: string | null;
}

interface SearchResultStory {
  id: number;
  sprintId: number;
  sprintName: string;
  jiraKey: string | null;
  jiraUrl: string;
  description: string;
  jiraTitle: string | null;
  jiraLabels: string[];
  status: StoryStatus;
  tags: Tag[];
}

interface SearchResultSubtask {
  id: number;
  storyId: number;
  storyJiraKey: string | null;
  title: string;
  comment: string | null;
  branchName: string | null;
  status: SubtaskStatus;
  type: string;
  repoName: string | null;
  complexityRating: number | null;
  releaseVersion: string | null;
}
```

## Backend implementation

### Search service: `server/services/searchService.ts`

```typescript
export interface SearchParams {
  query?: string;
  entities?: ("sprint" | "story" | "subtask")[];
  tagIds?: number[];
  storyId?: number;
  subtaskType?: string;
}

export interface SearchResults {
  sprints: SearchResultSprint[];
  stories: SearchResultStory[];
  subtasks: SearchResultSubtask[];
}

export function search(params: SearchParams): SearchResults
```

**Implementation approach:**

1. **Query building:**
   - Use SQL `LIKE` with `%` wildcards: `WHERE field LIKE '%' || ? || '%'`
   - Case-insensitive: use `LOWER()` for both column and search term
   - Search multiple fields per entity with `OR` conditions
   - Add textual `LIKE` predicates only when `query` is present; a tags-only search builds its story and
     subtask queries from tag predicates alone and skips the sprint query
   - Do not add a current-sprint, lifecycle, lock, or date restriction; every persisted sprint and its
     stories/subtasks is eligible

2. **Sprint search:**
   ```sql
   SELECT * FROM sprints
   WHERE LOWER(name) LIKE LOWER(?)
      OR LOWER(comment) LIKE LOWER(?)
      OR LOWER(project) LIKE LOWER(?)
   ```

3. **Story search:**
   ```sql
   SELECT s.*, sp.name as sprint_name
   FROM stories s
   JOIN sprints sp ON s.sprint_id = sp.id
   WHERE LOWER(s.description) LIKE LOWER(?)
      OR LOWER(s.jira_key) LIKE LOWER(?)
      OR LOWER(s.jira_title) LIKE LOWER(?)
       OR EXISTS (
         SELECT 1
         FROM json_each(CASE WHEN json_valid(s.jira_labels) THEN s.jira_labels ELSE '[]' END)
         WHERE LOWER(json_each.value) LIKE LOWER(?)
       )
   ```

4. **Subtask search:**
   ```sql
   SELECT sub.*, s.jira_key as story_jira_key
   FROM subtasks sub
   JOIN stories s ON sub.story_id = s.id
   WHERE (LOWER(sub.title) LIKE LOWER(?)
      OR LOWER(sub.comment) LIKE LOWER(?)
      OR LOWER(sub.branch_name) LIKE LOWER(?)
      OR LOWER(sub.repo_name) LIKE LOWER(?)
      OR LOWER(sub.release_version) LIKE LOWER(?))
   [AND sub.story_id = ? if storyId filter]
   [AND sub.type = ? if subtaskType filter]
   ```

5. **Internal tag filtering:**
   - Filter selected IDs through `entity_tags` with `entity_type = 'story'`.
   - Use a grouped subquery with `tag_id IN (...)` and
     `HAVING COUNT(DISTINCT tag_id) = selectedTagIds.length` to enforce AND semantics without duplicate
     story rows.
   - Apply the same parent-story subquery when returning subtasks.
   - Validate selected IDs against `tags`; JIRA labels do not participate in this filter.

6. **Result limits:**
   - Limit to 50 results per entity type to prevent performance issues
   - Can be made configurable later

### Search route: `server/routes/search.ts`

```typescript
import { Router } from "express";
import { search } from "../services/searchService.js";

export const searchRouter = Router();

searchRouter.get("/", (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rawTagIds = Array.isArray(req.query.tagId)
    ? req.query.tagId
    : req.query.tagId ? [req.query.tagId] : [];
  const parsedTagIds = rawTagIds.map(value => Number(value));
  if (parsedTagIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    res.status(400).json({ error: "tagId must contain positive integer IDs" });
    return;
  }
  const tagIds = [...new Set(parsedTagIds)];
  if (query && query.length < 2) {
    res.status(400).json({ error: "query must be at least 2 characters" });
    return;
  }
  if (!query && tagIds.length === 0) {
    res.status(400).json({ error: "provide a query of at least 2 characters or a tag" });
    return;
  }

  // Before searching, reject IDs that do not exist in the internal tags catalogue.

  const entities = req.query.entities
    ? (req.query.entities as string).split(",")
    : undefined;
  const storyId = req.query.storyId
    ? parseInt(req.query.storyId as string, 10)
    : undefined;
  const subtaskType = req.query.subtaskType as string | undefined;

  const results = search({ query, tagIds, entities, storyId, subtaskType });
  res.json(results);
});
```

Register in `server/app.ts`:
```typescript
import { searchRouter } from "./routes/search.js";
app.use("/api/search", searchRouter);
```

## Frontend implementation

### API client: `src/api/client.ts`

```typescript
export interface SearchParams {
  query?: string;
  entities?: ("sprint" | "story" | "subtask")[];
  tagIds?: number[];
  storyId?: number;
  subtaskType?: string;
}

async function search(params: SearchParams): Promise<SearchResults> {
  const queryParams = new URLSearchParams();
  if (params.query?.trim()) {
    queryParams.set("q", params.query.trim());
  }
  params.tagIds?.forEach(tagId => queryParams.append("tagId", tagId.toString()));
  if (params.entities && params.entities.length > 0) {
    queryParams.set("entities", params.entities.join(","));
  }
  if (params.storyId) {
    queryParams.set("storyId", params.storyId.toString());
  }
  if (params.subtaskType) {
    queryParams.set("subtaskType", params.subtaskType);
  }
  const response = await fetch(`${BASE_URL}/search?${queryParams}`);
  return handleResponse(response);
}
```

### Search page: `src/pages/SearchPage.tsx`

**State management:**
```typescript
const [query, setQuery] = useState("");
const [results, setResults] = useState<SearchResults | null>(null);
const [loading, setLoading] = useState(false);
const [entityFilters, setEntityFilters] = useState<Set<EntityType>>(new Set());
const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
const [availableTags, setAvailableTags] = useState<Tag[]>([]);
const [storyFilter, setStoryFilter] = useState<number | null>(null);
const [subtaskTypeFilter, setSubtaskTypeFilter] = useState<string | null>(null);
const [allStories, setAllStories] = useState<StorySummary[]>([]);
```

**Search execution:**
- Debounce input (300ms) to avoid excessive API calls
- Search when the text query has at least two characters or at least one tag is selected
- Cancel in-flight requests when any search criterion changes so stale responses cannot replace newer ones
- Show loading spinner during search
- Handle empty/error states

**UI components:**
- Search input with clear button
- Internal-tag autocomplete/multi-select populated using `api.listTags()`
- Selected-tag lozenges with accessible remove buttons
- Checkbox filters for entity types
- Dropdown filters for story and subtask type
- Result count summary
- Grouped result sections (sprints, stories, subtasks)

### Result card components

**`src/components/search/SprintResultCard.tsx`:**
```typescript
interface SprintResultCardProps {
  result: SearchResultSprint;
}

export function SprintResultCard({ result }: SprintResultCardProps) {
  return (
    <Link to={`/sprints/${result.id}`} className="search-result-card">
      <h3>{result.name}</h3>
      <div className="result-meta">
        {formatDisplayDate(result.startDate)} –{" "}
        {result.endDate ? formatDisplayDate(result.endDate) : "present"}
      </div>
      {result.project && <div>Project: {result.project}</div>}
      {result.comment && (
        <div className="result-snippet">{result.comment}</div>
      )}
    </Link>
  );
}
```

**`src/components/search/StoryResultCard.tsx`:**
```typescript
interface StoryResultCardProps {
  result: SearchResultStory;
}

export function StoryResultCard({ result }: StoryResultCardProps) {
  return (
    <Link to={`/stories/${result.id}`} className="search-result-card">
      <h3>
        {result.jiraKey && <span className="jira-key">{result.jiraKey}: </span>}
        {result.jiraTitle || result.description}
      </h3>
      <div className="result-meta">
        Sprint: {result.sprintName} · Status: <StatusBadge status={result.status} />
      </div>
      {result.tags.length > 0 && (
        <div className="tag-list">
          {result.tags.map(tag => <span key={tag.id} className="tag">{tag.name}</span>)}
        </div>
      )}
    </Link>
  );
}
```

**`src/components/search/SubtaskResultCard.tsx`:**
```typescript
interface SubtaskResultCardProps {
  result: SearchResultSubtask;
}

export function SubtaskResultCard({ result }: SubtaskResultCardProps) {
  return (
    <Link to={`/subtasks/${result.id}`} className="search-result-card">
      <h3>{result.title}</h3>
      <div className="result-meta">
        Story: {result.storyJiraKey || `#${result.storyId}`} ·{" "}
        Status: <StatusBadge status={result.status} /> ·{" "}
        Type: {result.type}
      </div>
      {result.branchName && (
        <div>Branch: {result.branchName}</div>
      )}
      {result.comment && (
        <div className="result-snippet">{result.comment}</div>
      )}
      {result.complexityRating && <div>Complexity: {result.complexityRating}</div>}
    </Link>
  );
}
```

### Styles: `src/pages/SearchPage.css`

```css
.search-page {
  max-width: 900px;
  margin: 0 auto;
}

.search-input-container {
  position: relative;
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 1.1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-advanced-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-result-card {
  display: block;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.search-result-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.search-result-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.result-meta {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.result-snippet {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  line-height: 1.4;
}

.search-results-section {
  margin-bottom: 2rem;
}

.search-results-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.search-empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
}
```

### Routing

Add to `src/main.tsx`:
```typescript
import { SearchPage } from "./pages/SearchPage";

// ... in router config
{
  path: "/search",
  element: <SearchPage />
}
```

Add search link to main navigation (e.g., in `src/App.tsx` or header component):
```typescript
<Link to="/search">🔍 Search</Link>
```

## Performance considerations

### Backend optimizations
- **Query length validation:** Reject queries shorter than 2 characters
- **Result limiting:** Cap at 50 results per entity type
- **Index creation:** Add indexes if search becomes slow
  ```sql
  CREATE INDEX IF NOT EXISTS idx_sprints_name ON sprints(LOWER(name));
  CREATE INDEX IF NOT EXISTS idx_stories_description ON stories(LOWER(description));
  CREATE INDEX IF NOT EXISTS idx_subtasks_title ON subtasks(LOWER(title));
  ```
- **Consider SQLite FTS5 later:** If performance becomes an issue with large datasets

### Frontend optimizations
- **Debouncing:** Wait 300ms after user stops typing before searching
- **Request cancellation:** Cancel in-flight requests if the query, tags, or filters change
- **Virtual scrolling:** If result counts exceed 100, implement pagination or virtual scrolling
- **Memoization:** Cache search results for identical queries

## Presentation reuse

- Use the existing `StatusBadge` component for story and subtask statuses so labels and colors remain
  consistent with the rest of the application.
- Use `StoryTypeIcon` and `SubtaskTypeIcon` where result cards display those concepts.
- Reuse the lozenge interaction and styles from `StoryDetailPage` and
  `src/components/stories/story-tags.css` for selected internal search tags. Extract a shared lozenge component
  only if doing so keeps both usages simple; do not couple the search selector to the story tag mutation
  API.
- Reuse existing date formatting and status/type catalogues. Do not introduce search-specific hard-coded
  mappings for domain values.

## Testing strategy

### Backend tests: `server/services/searchService.test.ts`
- A request with neither a valid text query nor tags is rejected
- Search matches sprints by name, comment, project
- Search matches stories by description, JIRA key, title, and JIRA-label text
- Search matches subtasks by title, comment, branch, repo, release version
- Available internal tags are loaded through the existing tags API
- Tags-only search returns matching stories and subtasks through their parent story, but no sprints
- Multiple internal tags use AND semantics and do not duplicate results
- Unknown and malformed tag IDs are rejected consistently
- Completed and locked sprint history remains searchable
- Case-insensitive matching works
- Entity filter narrows results correctly
- Story filter limits subtasks to specific story
- Subtask type filter works
- Result limits prevent excessive returns

### Integration tests: `e2e/search.spec.ts`
- Search input displays and accepts text
- Tag input suggests only known internal tags
- Selected tags render as removable lozenges
- Search can run with tags and no text query
- Combining text and tags narrows story and subtask results correctly
- Entity filter checkboxes toggle correctly
- Story filter dropdown populates and filters
- Subtask type filter dropdown populates and filters
- Search results display for all entity types
- Result cards link to correct detail pages
- Empty state shows when no results
- Loading state shows during search

### Manual verification
- Search for terms that appear in multiple entities
- Search by one and multiple internal tags, both with and without text
- Verify JIRA labels match through the ordinary text query
- Verify completed and locked sprint history is included
- Test filters in various combinations
- Verify navigation from result cards works
- Test with special characters in query
- Test with very long result sets

## Future enhancements (out of scope for initial implementation)

- **Advanced search syntax:** Support quotes for exact phrases, `-term` for exclusion, `field:value` syntax
- **Search history:** Remember recent searches, show suggestions
- **Saved searches:** Allow users to save and name frequent searches
- **Export results:** Download search results as markdown or CSV
- **Fuzzy matching:** Tolerate typos using Levenshtein distance
- **Full-text search with FTS5:** Better performance and ranking for large datasets
- **Keyboard navigation:** Arrow keys to navigate results, Enter to open
- **Search suggestions:** Auto-complete based on existing data
- **Result sorting:** Sort by date, relevance, entity type
- **Search within date range:** Filter by sprint dates or creation dates
- **Result highlighting:** Highlight matching text and add contextual snippets if this proves useful

## Acceptance criteria

✅ Search page is accessible from main navigation
✅ Can search across all entities with a single query
✅ Can filter results by entity type (sprints/stories/subtasks)
✅ Can filter subtasks by parent story
✅ Can filter subtasks by type
✅ Can filter using one or more known internal tags shown as removable lozenges
✅ Tag-only searches work without a text query
✅ Multiple tags use AND semantics
✅ JIRA labels are searchable through the ordinary text query
✅ All sprint history, including completed and locked sprints, is searchable
✅ Results display as cards with relevant metadata
✅ Clicking a result navigates to the entity's detail page
✅ Search is case-insensitive
✅ Empty and loading states are handled gracefully
✅ Search performance is acceptable (< 500ms for typical queries)

## Implementation phases

Implement the feature in the following order. Each phase should leave the application in a working state
and satisfy its exit criterion before the next phase begins.

### Phase 1: Freeze the contract and shared types

1. Define `EntityType`, `SearchParams`, the three discriminated result types, and `SearchResults` in the
   appropriate shared type declarations.
2. Confirm the searchable-field list and camelCase/database-column mappings for every result type.
3. Encode the agreed request semantics:
   - `q` is optional only when at least one `tagId` is supplied;
   - text queries are trimmed and must contain at least two characters;
   - repeated `tagId` parameters contain positive internal-tag IDs and use AND semantics;
   - JIRA labels participate only in free-text matching;
   - all persisted sprint history is eligible.
4. Decide and document the stable default ordering and the 50-result limit per entity group.

**Exit criterion:** the backend and frontend can import one agreed contract, with no duplicate local result
types or unresolved nullability decisions.

### Phase 2: Implement and test the search service

1. Create `server/services/searchService.ts` and keep query construction parameterized.
2. Normalize and escape the text query for literal SQL `LIKE` matching, including `%`, `_`, and the escape
   character itself.
3. Implement sprint, story, and subtask text searches, including JIRA-label values through `json_each`.
4. Add conditional query construction so tags-only searches skip sprint search and do not add empty text
   predicates.
5. Implement internal story-tag filtering through `entity_tags` using selected tag IDs, grouped
   `COUNT(DISTINCT tag_id)`, and AND semantics. Apply the parent-story filter to subtask results.
6. Apply entity, parent-story, and subtask-type filters without adding current-sprint, lock, lifecycle, or
   date restrictions.
7. Map database rows to the shared API types and apply deterministic ordering and per-group limits.
8. Add `server/services/searchService.test.ts`, covering every searchable field, special `LIKE` characters,
   JIRA-label text, tag-only searches, combined text/tag searches, duplicate tag IDs, multiple-tag AND
   behavior, filters, limits, ordering, null fields, and completed/locked history.

**Exit criterion:** service tests demonstrate correct results for text-only, tags-only, and combined searches
without exposing a route or UI.

### Phase 3: Add the HTTP route and API client

1. Create `server/routes/search.ts` and register it at `/api/search` in `server/app.ts`.
2. Validate and normalize all query parameters before calling the service:
   - reject missing criteria and one-character text queries;
   - reject unknown entity values, malformed IDs, invalid story IDs, and invalid subtask types;
   - de-duplicate repeated tag IDs and reject tag IDs not present in `tags`.
3. Return validation failures through the application's existing error-response conventions.
4. Add route/integration tests for successful combinations, repeated query parameters, invalid input, empty
   result groups, and service/database failures.
5. Add the typed `search` method to `src/api/client.ts`. Reuse `api.listTags()` for the internal-tag options;
   do not create a JIRA-label or search-specific tag catalogue endpoint.

**Exit criterion:** the complete search contract is accessible through `/api/search` and verified independently
of the search page.

### Phase 4: Build the page shell and navigation

1. Create `src/pages/SearchPage.tsx` and its styles using the existing page-layout conventions.
2. Register `/search` in the existing router and add the search entry to the main navigation.
3. Add the main text input, clear action, result-count area, and placeholders for filters and grouped results.
4. Implement the initial no-criteria state without issuing an API request.
5. Ensure the input has a visible or accessible label and works at narrow viewport widths.

**Exit criterion:** users can navigate to `/search`, enter and clear text, and see a stable page shell without
affecting existing routes.

### Phase 5: Implement search execution and result rendering

1. Add the 300 ms text debounce. Tag and discrete filter changes may search immediately.
2. Use `AbortController` or a request-generation guard so stale responses cannot replace newer results.
3. Implement distinct loading, success, no-results, and error states while retaining the current criteria.
4. Create `SprintResultCard`, `StoryResultCard`, and `SubtaskResultCard` components.
5. Reuse `StatusBadge`, `StoryTypeIcon`, `SubtaskTypeIcon`, existing tag styles, date formatting, and domain
   catalogues. Do not add result highlighting in this phase.
6. Link every card to the correct detail route and preserve normal browser link behavior.
7. Group results and show per-entity and total counts, omitting empty groups from the rendered results.

**Exit criterion:** text search works end to end across all three entity types, handles rapid query changes,
and links to the expected records.

### Phase 6: Add filters

Implement filters one at a time, adding focused tests after each:

1. Entity-type checkboxes, with no selection meaning all entity types.
2. Internal-tag multi-select populated by `api.listTags()`:
   - filter available tags by name in the separate tag input;
   - add selected `Tag` values as accessible removable lozenges;
   - prevent duplicate selections and hide or disable already selected options;
   - submit tag IDs, never tag names;
   - support tags-only search and multiple-tag AND behavior.
3. Parent-story dropdown for narrowing subtask results.
4. Subtask-type dropdown populated from the existing type catalogue.
5. Verify combinations of text, tags, entity types, story, and subtask type. Preserve all criteria while any
   one filter changes.

**Exit criterion:** every supported filter works alone where meaningful and in combination, and internal tags
remain clearly distinct from free-text JIRA-label matching.

### Phase 7: Accessibility, resilience, and UX polish

1. Announce loading, errors, and result-count changes using an appropriate polite live region.
2. Ensure the tag suggestions and lozenge remove controls have complete keyboard behavior, visible focus,
   and descriptive accessible names.
3. Verify Tab order, focus retention after removing a tag, and focus behavior after clearing the query.
4. Truncate long result text safely while retaining enough context to identify the result.
5. Confirm that empty and error states reflect both the text query and selected tags.
6. Add the optional `Ctrl+K` / `Cmd+K` shortcut only after the page interaction is complete, and avoid
   intercepting it inside editable controls unless intentionally supported.

**Exit criterion:** the search flow is keyboard-usable, screen-reader understandable, responsive, and robust
to failed or out-of-order requests.

### Phase 8: End-to-end verification and rollout

1. Add `e2e/search.spec.ts` with seeded matches in sprint text, story text, JIRA labels, subtask text, internal
   tags, and completed/locked history.
2. Cover text-only, tags-only, combined, filtered, no-result, error, cancellation, and detail-navigation flows.
3. Run unit, integration, end-to-end, type-check, lint, and production-build checks.
4. Measure representative searches against a realistically sized database and verify the typical request is
   below the 500 ms acceptance target. Do not add speculative indexes for leading-wildcard searches; record
   measurements and consider FTS5 only if the measured data justifies it.
5. Manually verify special characters, long text, all-history results, duplicate tag selections, narrow screens,
   and keyboard navigation.
6. Update user-facing documentation with navigation, text search, internal-tag filtering, filter combination,
   and query-length behavior.

**Exit criterion:** all acceptance criteria pass, existing application checks remain green, performance has been
measured, and the feature is documented for release.


