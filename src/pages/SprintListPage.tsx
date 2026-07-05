import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SprintSummary } from "@shared/types";
import { api } from "../api/client";
import { SprintCard } from "../components/sprints/SprintCard";

// home page ("/"): every sprint as a card, plus the new-sprint form.
export function SprintListPage(): React.ReactElement {
    const [sprints, setSprints] = useState<SprintSummary[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [comment, setComment] = useState<string>("");

    async function loadSprints() {
        const result: SprintSummary[] = await api.listSprints();
        setSprints(result);
    }

    useEffect(() => {
        loadSprints();
    }, []);

    async function handleCreateSprint() {
        if (!name.trim() || !startDate) {
            return;
        }
        await api.createSprint({ name: name.trim(), startDate, comment: comment.trim() || undefined });
        setName("");
        setStartDate("");
        setComment("");
        setShowForm(false);
        loadSprints();
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Sprints</h1>
                <div className="page-header-actions">
                    <Link to="/stats">stats</Link>
                    <Link to="/calendar">calendar</Link>
                    <Link to="/transitions">transitions</Link>
                    <button onClick={() => setShowForm(!showForm)}>new sprint</button>
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
                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
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
