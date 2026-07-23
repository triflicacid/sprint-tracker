import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { SearchResults } from "@shared/types";
import { api } from "../api/client";
import { SearchableInput } from "../components/SearchableInput";
import { SprintResultCard } from "../components/search/SprintResultCard";
import { StoryResultCard } from "../components/search/StoryResultCard";
import { SubtaskResultCard } from "../components/search/SubtaskResultCard";
import "./SearchPage.css";

export function SearchPage(): React.ReactElement {
    const [query, setQuery] = useState<string>("");
    const [projectSuggestions, setProjectSuggestions] = useState<string[]>([]);
    const [projectInput, setProjectInput] = useState<string>("");
    const [appliedProject, setAppliedProject] = useState<string | null>(null);
    const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
    const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
    const [debouncedQuery, setDebouncedQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const latestRequestRef = useRef<number>(0);

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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 300);
        return () => {
            clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSearchResults(null);
            setSearchError(null);
            setSearchLoading(false);
            return;
        }

        const requestId = latestRequestRef.current + 1;
        latestRequestRef.current = requestId;
        setSearchLoading(true);
        setSearchError(null);

        api.search({ query: debouncedQuery }).then((results) => {
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
    }, [debouncedQuery]);

    const hasCriteria = query.trim().length >= 2;
    const sprintCount = searchResults?.sprints.length ?? 0;
    const storyCount = searchResults?.stories.length ?? 0;
    const subtaskCount = searchResults?.subtasks.length ?? 0;
    const totalCount = sprintCount + storyCount + subtaskCount;

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
                        Enter at least 2 characters to search. Tag and advanced filters are added in the next phase.
                    </p>
                </div>

                <fieldset className="search-filter-group">
                    <legend>Entity filters</legend>
                    <label>
                        <input type="checkbox" disabled /> sprints
                    </label>
                    <label>
                        <input type="checkbox" disabled /> stories
                    </label>
                    <label>
                        <input type="checkbox" disabled /> subtasks
                    </label>
                    <p className="search-help-text">Entity filters are wired in a later phase; unchecked state defaults to all entities.</p>
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
                        <select id="search-story-filter" disabled defaultValue="">
                            <option value="">all stories</option>
                        </select>
                    </div>

                    <div className="search-filter-field">
                        <label htmlFor="search-subtask-type-filter" className="search-label">
                            Subtask type
                        </label>
                        <select id="search-subtask-type-filter" disabled defaultValue="">
                            <option value="">all types</option>
                        </select>
                    </div>
                </div>
            </div>

            <section className="search-results-shell" aria-live="polite">
                <h2>{hasCriteria ? `Results (${totalCount})` : "Results"}</h2>
                {!hasCriteria && (
                    <div className="search-empty-state">
                        <p>Start typing to search across all sprint history.</p>
                        {appliedProject && <p>Project filter is ready, but a text query or tags will still be required.</p>}
                    </div>
                )}
                {hasCriteria && searchLoading && <div className="search-results-placeholder">loading...</div>}
                {hasCriteria && !searchLoading && searchError && (
                    <div className="search-results-placeholder search-error-text">{searchError}</div>
                )}
                {hasCriteria && !searchLoading && !searchError && searchResults && totalCount === 0 && (
                    <div className="search-results-placeholder">No results for "{query.trim()}". Try a different query.</div>
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

