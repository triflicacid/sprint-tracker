import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { SprintDetail } from "@shared/types";
import { api } from "../api/client";
import { StoryCard } from "../components/stories/StoryCard";
import { formatIsoDate } from "../utils/calendarGrid";
import { isSprintLocked } from "@shared/sprintLock";
import { LockIcon } from "../components/LockIcon";
import { loadExportFields } from "../utils/exportFields";
import { downloadTextFile } from "../utils/download";
import { useToast } from "../components/Toast";
import { CommentEditor } from "../components/CommentEditor";
import { MetaRow } from "../components/MetaRow";
import { ExportButton } from "../components/ExportButton";
import "../components/sprints/SprintCard.css";
import "./SprintDetailPage.css";

// a sprint ("/sprints/:id"): its stories, holiday management, and comment.
export function SprintDetailPage(): React.ReactElement {
    const { id } = useParams<{ id: string }>();
    const sprintId: number = Number(id);
    const [sprint, setSprint] = useState<SprintDetail | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [jiraUrl, setJiraUrl] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [holidays, setHolidays] = useState<string[]>([]);
    const [newHolidayDate, setNewHolidayDate] = useState<string>("");
    const [exporting, setExporting] = useState<boolean>(false);
    const { showError } = useToast();

    async function loadSprint() {
        try {
            const result: SprintDetail = await api.getSprint(sprintId);
            setSprint(result);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "sprint not found");
        }
    }

    async function loadHolidays(startDate: string, endDate: string | null) {
        const dates: string[] = await api.listHolidays(startDate, endDate ?? formatIsoDate(new Date()));
        setHolidays(dates);
    }

    useEffect(() => {
        loadSprint();
    }, [sprintId]);

    useEffect(() => {
        if (!sprint) {
            return;
        }
        loadHolidays(sprint.startDate, sprint.endDate);
    }, [sprint?.startDate, sprint?.endDate]);

    async function saveComment(draft: string) {
        await api.updateSprint(sprintId, { comment: draft });
        loadSprint();
    }

    async function handleAddHoliday() {
        if (!newHolidayDate || !sprint) {
            return;
        }
        await api.addHoliday(newHolidayDate);
        setNewHolidayDate("");
        loadHolidays(sprint.startDate, sprint.endDate);
    }

    async function handleRemoveHoliday(date: string) {
        if (!sprint) {
            return;
        }
        await api.removeHoliday(date);
        loadHolidays(sprint.startDate, sprint.endDate);
    }

    async function handleQuickExport() {
        setExporting(true);
        try {
            const markdown = await api.exportMarkdown([sprintId], loadExportFields());
            downloadTextFile(`sprint-export-${formatIsoDate(new Date())}.md`, markdown);
        } catch (error) {
            showError(error instanceof Error ? error.message : "failed to generate export");
        } finally {
            setExporting(false);
        }
    }

    async function handleCreateStory() {
        if (!jiraUrl.trim() || !description.trim()) {
            return;
        }
        await api.createStory(sprintId, { jiraUrl: jiraUrl.trim(), description: description.trim() });
        setJiraUrl("");
        setDescription("");
        setShowForm(false);
        loadSprint();
    }

    if (loadError) {
        return (
            <div className="page">
                <p>{loadError}</p>
                <Link to="/" className="back-link">
                    back to home
                </Link>
            </div>
        );
    }

    if (!sprint) {
        return <div className="page">loading...</div>;
    }

    const locked = isSprintLocked(sprint);
    const lockedTitle = "this sprint has ended";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">
                        back to sprints
                    </Link>
                    <h1>
                        {locked && <LockIcon />}
                        {sprint.name}
                    </h1>
                    <MetaRow>
                        <span className="sprint-card-dates">
                            {sprint.startDate} to {sprint.endDate ?? "present"}
                        </span>
                    </MetaRow>
                    <CommentEditor
                        comment={sprint.comment}
                        displayClassName="sprint-card-comment"
                        onSave={saveComment}
                    />
                </div>
                <div className="page-header-actions">
                    <Link to={`/stats/${sprint.id}`}>stats</Link>
                    <ExportButton onClick={handleQuickExport} loading={exporting} label="export" />
                    <button onClick={() => setShowForm(!showForm)}>new story</button>
                </div>
            </div>

            <div className="holiday-list">
                {holidays.map((date) => (
                    <span key={date} className="holiday-chip">
                        {date}
                        <button
                            className="holiday-remove"
                            onClick={() => handleRemoveHoliday(date)}
                            disabled={locked}
                            title={locked ? lockedTitle : undefined}
                        >
                            x
                        </button>
                    </span>
                ))}
                <input
                    type="date"
                    value={newHolidayDate}
                    min={sprint.startDate}
                    max={sprint.endDate ?? undefined}
                    onChange={(event) => setNewHolidayDate(event.target.value)}
                    disabled={locked}
                    title={locked ? lockedTitle : undefined}
                />
                <button onClick={handleAddHoliday} disabled={locked} title={locked ? lockedTitle : undefined}>
                    add holiday
                </button>
            </div>

            {showForm && (
                <div className="new-story-form">
                    <input
                        type="text"
                        placeholder="jira link"
                        value={jiraUrl}
                        onChange={(event) => setJiraUrl(event.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <button onClick={handleCreateStory}>create</button>
                </div>
            )}

            <div className="story-list">
                {sprint.stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                ))}
            </div>
        </div>
    );
}
