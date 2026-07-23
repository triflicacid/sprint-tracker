import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { SearchEntityType, SearchResults, StorySummary, SubtaskTypeEntry, Tag } from "@shared/types";
import { api } from "../api/client";
import { SearchableInput } from "../components/SearchableInput";
import { SprintResultCard } from "../components/search/SprintResultCard";
import { StoryResultCard } from "../components/search/StoryResultCard";
import { SubtaskResultCard } from "../components/search/SubtaskResultCard";
import "../components/stories/story-tags.css";
import "./SearchPage.css";

const ENTITY_FILTERS: { key: SearchEntityType; label: string }[] = [
    { key: "sprint", label: "sprints" },
    { key: "story", label: "stories" },
    { key: "subtask", label: "subtasks" },
];

interface StoryOption {
    id: number;
    label: string;
}

export function SearchPage(): React.ReactElement {
    const [query, setQuery] = useState<string>("");
    const [entityFilters, setEntityFilters] = useState<Set<SearchEntityType>>(new Set());
    const [projectSuggestions, setProjectSuggestions] = useState<string[]>([]);
    const [projectInput, setProjectInput] = useState<string>("");
    const [appliedProject, setAppliedProject] = useState<string | null>(null);
    const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
    const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState<string>("");
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [allStories, setAllStories] = useState<StoryOption[]>([]);
    const [storyFilter, setStoryFilter] = useState<number | null>(null);
    const [subtaskTypes, setSubtaskTypes] = useState<string[]>([]);
    const [subtaskTypeFilter, setSubtaskTypeFilter] = useState<string | null>(null);
    const [debouncedQuery, setDebouncedQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const latestRequestRef = useRef<number>(0);
    const queryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let active = true;
        api.listSprintProjects()
            .then((projects) => {
                if (!active) {
                    return;
                }
                setProjectSuggestions(projects);
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }
                setProjectLoadError(error instanceof Error ? error.message : "failed to load projects");
            })
            .finally(() => {
                if (active) {
                    setLoadingProjects(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadFilters() {
            try {
                const [tags, types, sprints] = await Promise.all([
                    api.listTags(),
                    api.getSubtaskTypes(),
                    api.listSprints(),
                ]);
                if (!active) {
                    return;
                }

                setAvailableTags(tags.filter((tag) => tag.tagType === "custom"));
                const selectableTypes = types
                    .filter((type: SubtaskTypeEntry) => type.selectable !== false)
                    .map((type) => type.shortName);
                setSubtaskTypes(selectableTypes);

                const sprintDetails = await Promise.all(sprints.map((sprint) => api.getSprint(sprint.id)));
                if (!active) {
                    return;
                }

                const storyOptions: StoryOption[] = [];
                for (const sprint of sprintDetails) {
                    for (const story of sprint.stories) {
                        const storySummary = story as StorySummary;
                        const label = `${storySummary.jiraKey ? `${storySummary.jiraKey}: ` : ""}${storySummary.jiraTitle ?? storySummary.description}`;
                        storyOptions.push({ id: storySummary.id, label });
                    }
                }
                storyOptions.sort((a, b) => a.label.localeCompare(b.label));
                setAllStories(storyOptions);
            } catch {
                if (active) {
                    // Keep filter controls usable even if optional catalogues fail.
                    setAvailableTags([]);
                    setSubtaskTypes([]);
                    setAllStories([]);
                }
            }
        }

        loadFilters();

        return () => {
            active = false;
        };
    }, []);

    function handleProjectInputChange(value: string) {
        setProjectInput(value);
        if (appliedProject && value.trim() !== appliedProject) {
            setAppliedProject(null);
        }
    }

    function handleProjectSuggestionSelect(value: string) {
        setProjectInput(value);
        setAppliedProject(value);
    }

    function clearQuery() {
        setQuery("");
    }

    function toggleEntityFilter(entity: SearchEntityType) {
        setEntityFilters((current) => {
            const next = new Set(current);
            if (next.has(entity)) {
                next.delete(entity);
            } else {
                next.add(entity);
            }
            return next;
        });
    }

    function addTag(tag: Tag) {
        setSelectedTags((current) => {
            if (current.some((selected) => selected.id === tag.id)) {
                return current;
            }
            return [...current, tag];
        });
        setTagInput("");
    }

    function removeTag(tagId: number) {
        setSelectedTags((current) => current.filter((tag) => tag.id !== tagId));
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 300);
        return () => {
            clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        function handleShortcut(event: KeyboardEvent) {
            if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") {
                return;
            }
            const activeElement = document.activeElement as HTMLElement | null;
            if (
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.tagName === "SELECT" ||
                    activeElement.isContentEditable)
            ) {
                return;
            }
            event.preventDefault();
            queryInputRef.current?.focus();
        }

        window.addEventListener("keydown", handleShortcut);
        return () => {
            window.removeEventListener("keydown", handleShortcut);
        };
    }, []);

    const hasValidTextQuery = debouncedQuery.length >= 2;
    const hasTagCriteria = selectedTags.length > 0;
    const hasSearchCriterion = hasValidTextQuery || hasTagCriteria;

    useEffect(() => {
        if (!hasSearchCriterion) {
            setSearchResults(null);
            setSearchError(null);
            setSearchLoading(false);
            return;
        }

        const requestId = latestRequestRef.current + 1;
        latestRequestRef.current = requestId;
        setSearchLoading(true);
        setSearchError(null);

        const entities = entityFilters.size > 0 ? Array.from(entityFilters) : undefined;
        api.search({
            query: hasValidTextQuery ? debouncedQuery : undefined,
            tagIds: selectedTags.map((tag) => tag.id),
            entities,
            project: appliedProject ?? undefined,
            storyId: storyFilter ?? undefined,
            subtaskType: subtaskTypeFilter ?? undefined,
        }).then((results) => {
            if (latestRequestRef.current !== requestId) {
                return;
            }
            setSearchResults(results);
        }).catch((error: unknown) => {
            if (latestRequestRef.current !== requestId) {
                return;
            }
            setSearchResults(null);
            setSearchError(error instanceof Error ? error.message : "search failed");
        }).finally(() => {
            if (latestRequestRef.current === requestId) {
                setSearchLoading(false);
            }
        });
    }, [
        appliedProject,
        debouncedQuery,
        entityFilters,
        hasSearchCriterion,
        hasValidTextQuery,
        selectedTags,
        storyFilter,
        subtaskTypeFilter,
    ]);

    const hasCriteria = query.trim().length >= 2 || selectedTags.length > 0;
    const sprintCount = searchResults?.sprints.length ?? 0;
    const storyCount = searchResults?.stories.length ?? 0;
    const subtaskCount = searchResults?.subtasks.length ?? 0;
    const totalCount = sprintCount + storyCount + subtaskCount;
    const filteredTagSuggestions = availableTags.filter((tag) => {
        if (selectedTags.some((selected) => selected.id === tag.id)) {
            return false;
        }
        if (!tagInput.trim()) {
            return true;
        }
        return tag.name.toLowerCase().includes(tagInput.toLowerCase());
    });
    const activeCriteriaParts: string[] = [];
    if (query.trim()) {
        activeCriteriaParts.push(`text \"${query.trim()}\"`);
    }
    if (selectedTags.length > 0) {
        activeCriteriaParts.push(`tags ${selectedTags.map((tag) => tag.name).join(", ")}`);
    }
    if (appliedProject) {
        activeCriteriaParts.push(`project ${appliedProject}`);
    }
    if (storyFilter !== null) {
        const selectedStory = allStories.find((story) => story.id === storyFilter);
        if (selectedStory) {
            activeCriteriaParts.push(`story ${selectedStory.label}`);
        }
    }
    if (subtaskTypeFilter) {
        activeCriteriaParts.push(`subtask type ${subtaskTypeFilter}`);
    }
    if (entityFilters.size > 0) {
        activeCriteriaParts.push(`entities ${Array.from(entityFilters).join(", ")}`);
    }
    const criteriaSummary = activeCriteriaParts.length > 0 ? activeCriteriaParts.join("; ") : "current criteria";

    return (
        <div className="page search-page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">
                        back to sprints
                    </Link>
                    <h1>Search</h1>
                </div>
            </div>

            <div className="search-shell">
                <div className="search-query-row">
                    <label htmlFor="search-query-input" className="search-label">
                        Query
                    </label>
                    <div className="search-query-controls">
                        <input
                            id="search-query-input"
                            ref={queryInputRef}
                            type="text"
                            className="search-query-input"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="search sprints, stories, and subtasks"
                        />
                        <button type="button" onClick={clearQuery} disabled={!query}>
                            clear
                        </button>
                    </div>
                    <p className="search-help-text">
                        Enter at least 2 characters or select at least one internal tag.
                    </p>
                </div>

                <div className="search-filter-field search-tag-filter-field">
                    <label htmlFor="search-tag-input" className="search-label">
                        Internal tags
                    </label>
                    <input
                        id="search-tag-input"
                        type="text"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        placeholder="search tags"
                    />
                    {filteredTagSuggestions.length > 0 && (
                        <div className="search-tag-suggestions">
                            {filteredTagSuggestions.slice(0, 8).map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className="search-tag-suggestion"
                                    onClick={() => addTag(tag)}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedTags.length > 0 && (
                        <div className="tag-list">
                            {selectedTags.map((tag) => (
                                <span key={tag.id} className={`tag tag-${tag.tagType}`}>
                                    {tag.name}
                                    <button className="tag-remove" onClick={() => removeTag(tag.id)} aria-label={`remove ${tag.name}`}>
                                        x
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <fieldset className="search-filter-group">
                    <legend>Entity filters</legend>
                    {ENTITY_FILTERS.map((entity) => (
                        <label key={entity.key}>
                            <input
                                type="checkbox"
                                checked={entityFilters.has(entity.key)}
                                onChange={() => toggleEntityFilter(entity.key)}
                            /> {entity.label}
                        </label>
                    ))}
                    <p className="search-help-text">No selections means all entities.</p>
                </fieldset>

                <div className="search-advanced-filters">
                    <div className="search-filter-field">
                        <span className="search-label">Project</span>
                        <SearchableInput
                            onChange={handleProjectInputChange}
                            onClick={handleProjectSuggestionSelect}
                            suggestions={projectSuggestions}
                            placeholder={loadingProjects ? "loading projects..." : "search/select project"}
                            className="search-project-input"
                        />
                        {projectLoadError && <p className="search-error-text">{projectLoadError}</p>}
                        {!projectLoadError && (
                            <p className="search-help-text">
                                {appliedProject
                                    ? `Applied project: ${appliedProject}`
                                    : projectInput.trim()
                                        ? "Type to narrow suggestions and select one to apply the filter."
                                        : "No project filter selected."}
                            </p>
                        )}
                    </div>

                    <div className="search-filter-field">
                        <label htmlFor="search-story-filter" className="search-label">
                            Within story
                        </label>
                        <select
                            id="search-story-filter"
                            value={storyFilter ?? ""}
                            onChange={(event) => setStoryFilter(event.target.value ? Number(event.target.value) : null)}
                        >
                            <option value="">all stories</option>
                            {allStories.map((story) => (
                                <option key={story.id} value={story.id}>
                                    {story.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="search-filter-field">
                        <label htmlFor="search-subtask-type-filter" className="search-label">
                            Subtask type
                        </label>
                        <select
                            id="search-subtask-type-filter"
                            value={subtaskTypeFilter ?? ""}
                            onChange={(event) => setSubtaskTypeFilter(event.target.value || null)}
                        >
                            <option value="">all types</option>
                            {subtaskTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <section className="search-results-shell" aria-live="polite">
                <h2>{hasCriteria ? `Results (${totalCount})` : "Results"}</h2>
                {!hasCriteria && (
                    <div className="search-empty-state">
                        <p>Start typing to search across all sprint history, or select one or more internal tags.</p>
                        {appliedProject && <p>Project filter is ready, but text or tags are still required.</p>}
                    </div>
                )}
                {hasCriteria && searchLoading && <div className="search-results-placeholder">loading...</div>}
                {hasCriteria && !searchLoading && searchError && (
                    <div className="search-results-placeholder search-error-text">
                        Search failed for {criteriaSummary}: {searchError}
                    </div>
                )}
                {hasCriteria && !searchLoading && !searchError && searchResults && totalCount === 0 && (
                    <div className="search-results-placeholder">
                        No results for {criteriaSummary}. Try broadening the query or clearing one filter.
                    </div>
                )}
                {hasCriteria && !searchLoading && !searchError && searchResults && totalCount > 0 && (
                    <div className="search-result-groups">
                        {sprintCount > 0 && (
                            <section className="search-results-group">
                                <h3>Sprints ({sprintCount})</h3>
                                <div className="search-results-list">
                                    {searchResults.sprints.map((result) => (
                                        <SprintResultCard key={result.id} result={result} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {storyCount > 0 && (
                            <section className="search-results-group">
                                <h3>Stories ({storyCount})</h3>
                                <div className="search-results-list">
                                    {searchResults.stories.map((result) => (
                                        <StoryResultCard key={result.id} result={result} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {subtaskCount > 0 && (
                            <section className="search-results-group">
                                <h3>Subtasks ({subtaskCount})</h3>
                                <div className="search-results-list">
                                    {searchResults.subtasks.map((result) => (
                                        <SubtaskResultCard key={result.id} result={result} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

