import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { SearchableInput } from "../components/SearchableInput";
import "./SearchPage.css";

export function SearchPage(): React.ReactElement {
    const [query, setQuery] = useState<string>("");
    const [projectSuggestions, setProjectSuggestions] = useState<string[]>([]);
    const [projectInput, setProjectInput] = useState<string>("");
    const [appliedProject, setAppliedProject] = useState<string | null>(null);
    const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
    const [projectLoadError, setProjectLoadError] = useState<string | null>(null);

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

    const hasCriteria = query.trim().length >= 2;

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
                        Enter at least 2 characters to search. Tag-only and full result rendering arrive in later phases.
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
                <h2>Results</h2>
                {!hasCriteria && (
                    <div className="search-empty-state">
                        <p>Start typing to search across all sprint history.</p>
                        {appliedProject && <p>Project filter is ready, but a text query or tags will still be required.</p>}
                    </div>
                )}
                {hasCriteria && (
                    <div className="search-results-placeholder">
                        <p>Search execution and live grouped results are implemented in Phase 5.</p>
                        <div className="search-group-placeholder">Sprints (0)</div>
                        <div className="search-group-placeholder">Stories (0)</div>
                        <div className="search-group-placeholder">Subtasks (0)</div>
                    </div>
                )}
            </section>
        </div>
    );
}

