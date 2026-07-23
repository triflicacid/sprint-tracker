import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SprintSummary } from "@shared/types";
import { api } from "../api/client";
import { SprintCard } from "../components/sprints/SprintCard";
import { SearchableInput } from "../components/SearchableInput";
import "./SprintListPage.css";

/**
 * home page ("/")
 * 
 * lists all sprints and provides new-sprint form
 */
export function SprintListPage(): React.ReactElement {
    const [sprints, setSprints] = useState<SprintSummary[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [comment, setComment] = useState<string>("");
    const [project, setProject] = useState<string>("");
    const [projectSuggestions, setProjectSuggestions] = useState<string[]>([]);

    async function loadSprints() {
        const result: SprintSummary[] = await api.listSprints();
        setSprints(result);
    }

    async function loadProjectSuggestions() {
        const result: string[] = await api.listSprintProjects();
        setProjectSuggestions(result);
    }

    useEffect(() => {
        loadSprints();
        loadProjectSuggestions();
    }, []);

    function handleShowForm() {
        setShowForm(!showForm);
        // auto-populate project from most recent sprint when opening form
        if (!showForm && sprints.length > 0) {
            const lastSprint = sprints[0]; // sprints are ordered by newest first
            if (lastSprint.project) {
                setProject(lastSprint.project);
            }
        }
    }

    async function handleCreateSprint() {
        if (!name.trim() || !startDate) {
            return;
        }
        await api.createSprint({
            name: name.trim(),
            startDate,
            comment: comment.trim() || undefined,
            project: project.trim() || undefined
        });
        setName("");
        setStartDate("");
        setComment("");
        setProject("");
        setShowForm(false);
        loadSprints();
        loadProjectSuggestions();
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Sprints</h1>
                <div className="page-header-actions">
                    <Link to="/stats">stats</Link>
                    <Link to="/timesheet">timesheet</Link>
                    <Link to="/transitions">transitions</Link>
                    <Link to="/categories">categories</Link>
                    <Link to="/export">export</Link>
                    <button onClick={handleShowForm}>new sprint</button>
                </div>
            </div>

            {showForm && (
                <div className="new-sprint-form">
                    <input
                        type="text"
                        placeholder="sprint name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <span>starting</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                    <SearchableInput
                        //initialValue={project}
                        onChange={setProject}
                        onClick={setProject}
                        suggestions={projectSuggestions}
                        placeholder="project (optional)"
                    />
                    <input
                        type="text"
                        placeholder="comment (optional)"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                    />
                    <button onClick={handleCreateSprint}>create</button>
                </div>
            )}

            <div className="sprint-list">
                {sprints.map((sprint) => (
                    <SprintCard key={sprint.id} sprint={sprint} />
                ))}
            </div>
        </div>
    );
}
