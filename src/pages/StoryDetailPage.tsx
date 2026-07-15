import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { StoryDetail, StatusFlowConfig, StatusHistoryEntry } from "@shared/types";
import { isSprintLocked } from "@shared/sprintLock";
import { api } from "../api/client";
import { LockIcon } from "../components/LockIcon";
import { StoryTypeIcon } from "../components/stories/StoryTypeIcon";
import { StatusBadge, STATUS_LABELS } from "../components/StatusBadge";
import { SubtaskRow } from "../components/subtasks/SubtaskRow";
import { exportSectionsAsPdf, type PdfSection } from "../utils/pdfExport";
import { computeSubtaskTiming, buildSubtaskPdfSection } from "../utils/subtaskTiming";
import { buildStoryPdfFilename } from "../utils/pdfFilename";
import { MetaRow } from "../components/MetaRow";
import { RatingSelect } from "../components/RatingSelect";
import { ExportButton } from "../components/ExportButton";
import "../components/stories/story-tags.css";
import "./StoryDetailPage.css";

interface SubtaskHistorySnapshot {
    subtaskId: number;
    history: StatusHistoryEntry[];
}

const STORY_POINTS_OPTIONS = [1, 2, 3, 5, 8, 13];

// a story ("/stories/:id"): its subtasks, tags, and Jira refresh action.
export function StoryDetailPage(): React.ReactElement {
    const { id } = useParams<{ id: string }>();
    const storyId: number = Number(id);
    const [story, setStory] = useState<StoryDetail | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [flow, setFlow] = useState<StatusFlowConfig | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>("");
    const [newTagName, setNewTagName] = useState<string>("");
    const [jiraLoading, setJiraLoading] = useState<boolean>(false);
    const [exportSnapshot, setExportSnapshot] = useState<SubtaskHistorySnapshot[] | null>(null);
    const [exporting, setExporting] = useState<boolean>(false);

    const barChartRef = useRef<HTMLDivElement>(null);
    const titleIconRef = useRef<HTMLSpanElement>(null);

    async function loadStory() {
        try {
            const result: StoryDetail = await api.getStory(storyId);
            setStory(result);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "story not found");
        }
    }

    useEffect(() => {
        loadStory();
    }, [storyId]);

    useEffect(() => {
        api.getStatusFlow().then(setFlow);
    }, []);

    async function handleAwaitingMoreSubtasksChange(checked: boolean) {
        await api.updateStory(storyId, { awaitingMoreSubtasks: checked });
        loadStory();
    }

    async function handleStoryPointsChange(value: string) {
        await api.updateStory(storyId, { storyPoints: value === "" ? null : Number(value) });
        loadStory();
    }

    async function handleAddSubtask() {
        if (!newSubtaskTitle.trim()) {
            return;
        }
        await api.createSubtask(storyId, { title: newSubtaskTitle.trim() });
        setNewSubtaskTitle("");
        loadStory();
    }

    async function handleAddTag() {
        if (!newTagName.trim()) {
            return;
        }
        await api.addStoryTag(storyId, newTagName.trim());
        setNewTagName("");
        loadStory();
    }

    async function handleRemoveTag(tagId: number) {
        await api.removeStoryTag(storyId, tagId);
        loadStory();
    }

    async function handleFetchJiraInfo() {
        if (!story?.jiraKey) {
            return;
        }
        setJiraLoading(true);
        try {
            await api.getJiraInfo(story.jiraKey, storyId);
            await loadStory();
        } finally {
            setJiraLoading(false);
        }
    }

    async function handleExportPdf() {
        if (!story) {
            return;
        }
        setExporting(true);
        const histories = await Promise.all(story.subtasks.map((subtask) => api.getSubtaskHistory(subtask.id)));
        setExportSnapshot(story.subtasks.map((subtask, index) => ({ subtaskId: subtask.id, history: histories[index] })));
    }

    useEffect(() => {
        if (!exportSnapshot || !story || !flow) {
            return;
        }
        (async () => {
            // can only measure after a pain, so wait two frames first
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const sections: PdfSection[] = [
                {
                    title: story.jiraTitle ?? story.description,
                    titleIcon: titleIconRef.current ?? undefined,
                    element: barChartRef.current ?? undefined,
                    lines: [
                        { text: `Jira: ${story.jiraKey ?? story.jiraUrl}`, url: story.jiraUrl },
                        `Status: ${STATUS_LABELS[story.status] ?? story.status.toLowerCase()}`,
                        `Subtasks: ${story.subtasks.length}`,
                        `Pull requests: ${story.prCount}`,
                        `Tags: ${story.tags.length > 0 ? story.tags.map((tag) => tag.name).join(", ") : "none"}`,
                        ...(story.awaitingMoreSubtasks ? ["Awaiting more subtasks: yes"] : []),
                    ],
                },
                ...story.subtasks.map((subtask) => {
                    const history = exportSnapshot.find((snapshot) => snapshot.subtaskId === subtask.id)?.history ?? [];
                    return buildSubtaskPdfSection(subtask, history);
                }),
            ];

            await exportSectionsAsPdf(sections, buildStoryPdfFilename(story));
            setExportSnapshot(null);
            setExporting(false);
        })();
    }, [exportSnapshot]);

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

    if (!story || !flow) {
        return <div className="page">loading...</div>;
    }

    const locked = isSprintLocked({ endDate: story.sprintEndDate });

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to={`/sprints/${story.sprintId}`} className="back-link">
                        back to sprint
                    </Link>
                    <h1>
                        {locked && <LockIcon />}
                        <span ref={titleIconRef} className="story-type-icon-wrap">
                            <StoryTypeIcon isBug={story.isBug} />
                        </span>
                        {story.jiraTitle ?? story.description}
                    </h1>
                    <MetaRow>
                        <a href={story.jiraUrl} target="_blank" rel="noreferrer">
                            {story.jiraKey ?? story.jiraUrl}
                        </a>
                        <StatusBadge status={story.status} />
                        {locked ? (
                            story.awaitingMoreSubtasks && (
                                <span className="awaiting-more-subtasks">awaiting more subtasks</span>
                            )
                        ) : (
                            <label className="awaiting-more-subtasks">
                                <input
                                    type="checkbox"
                                    checked={story.awaitingMoreSubtasks}
                                    onChange={(event) => handleAwaitingMoreSubtasksChange(event.target.checked)}
                                />
                                awaiting more subtasks
                            </label>
                        )}
                    </MetaRow>
                </div>
                <div className="page-header-actions">
                    <div className="page-header-buttons">
                        {story.jiraKey && !locked && (
                            <button onClick={handleFetchJiraInfo} disabled={jiraLoading}>
                                {jiraLoading ? "fetching..." : "refresh from jira"}
                            </button>
                        )}
                        <ExportButton onClick={handleExportPdf} loading={exporting} />
                    </div>
                    <RatingSelect
                        label="story points:"
                        value={story.storyPoints}
                        options={STORY_POINTS_OPTIONS}
                        onChange={handleStoryPointsChange}
                        readOnly={locked}
                    />
                </div>
            </div>

            <div className="tag-list">
                {story.tags.map((tag) => (
                    <span key={tag.id} className={`tag tag-${tag.tagType}`}>
                        {tag.name}
                        {tag.tagType === "custom" && !locked && (
                            <button className="tag-remove" onClick={() => handleRemoveTag(tag.id)}>
                                x
                            </button>
                        )}
                    </span>
                ))}
                {!locked && (
                    <input
                        type="text"
                        placeholder="add tag"
                        value={newTagName}
                        onChange={(event) => setNewTagName(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleAddTag()}
                    />
                )}
            </div>

            <div className="subtask-list">
                {story.subtasks.map((subtask) => (
                    <SubtaskRow
                        key={subtask.id}
                        subtask={subtask}
                        flow={flow}
                        onChanged={loadStory}
                        sprintLocked={locked}
                    />
                ))}
            </div>

            {!locked && (
                <div className="add-subtask-form">
                    <input
                        type="text"
                        placeholder="subtask title"
                        value={newSubtaskTitle}
                        onChange={(event) => setNewSubtaskTitle(event.target.value)}
                    />
                    <button onClick={handleAddSubtask}>add subtask</button>
                </div>
            )}

            {exportSnapshot && (
                <div style={{ position: "fixed", top: 0, left: -10000, width: 900, pointerEvents: "none" }}>
                    <div ref={barChartRef}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={story.subtasks.map((subtask) => ({
                                    label: subtask.title,
                                    days: computeSubtaskTiming(
                                        exportSnapshot.find((snapshot) => snapshot.subtaskId === subtask.id)?.history ?? []
                                    ).totalDays,
                                }))}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                                <YAxis type="category" dataKey="label" stroke="#9ca3af" width={220} />
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                                <Bar dataKey="days" fill="#2563eb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
