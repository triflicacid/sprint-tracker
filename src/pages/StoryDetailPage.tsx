import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { StoryDetail, StatusFlowConfig } from "@shared/types";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { SubtaskRow } from "../components/subtasks/SubtaskRow";

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

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to={`/sprints/${story.sprintId}`} className="back-link">
                        back to sprint
                    </Link>
                    <h1>{story.jiraTitle ?? story.description}</h1>
                    <div className="story-meta-row">
                        <a href={story.jiraUrl} target="_blank" rel="noreferrer">
                            {story.jiraKey ?? story.jiraUrl}
                        </a>
                        <StatusBadge status={story.status} />
                        <label className="awaiting-more-subtasks">
                            <input
                                type="checkbox"
                                checked={story.awaitingMoreSubtasks}
                                onChange={(event) => handleAwaitingMoreSubtasksChange(event.target.checked)}
                            />
                            awaiting more subtasks
                        </label>
                    </div>
                </div>
                {story.jiraKey && (
                    <button onClick={handleFetchJiraInfo} disabled={jiraLoading}>
                        {jiraLoading ? "fetching..." : "refresh from jira"}
                    </button>
                )}
            </div>

            <div className="tag-list">
                {story.tags.map((tag) => (
                    <span key={tag.id} className={`tag tag-${tag.tagType}`}>
                        {tag.name}
                        {tag.tagType === "custom" && (
                            <button className="tag-remove" onClick={() => handleRemoveTag(tag.id)}>
                                x
                            </button>
                        )}
                    </span>
                ))}
                <input
                    type="text"
                    placeholder="add tag"
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleAddTag()}
                />
            </div>

            <div className="subtask-list">
                {story.subtasks.map((subtask) => (
                    <SubtaskRow
                        key={subtask.id}
                        subtask={subtask}
                        flow={flow}
                        onChanged={loadStory}
                    />
                ))}
            </div>

            <div className="add-subtask-form">
                <input
                    type="text"
                    placeholder="subtask title"
                    value={newSubtaskTitle}
                    onChange={(event) => setNewSubtaskTitle(event.target.value)}
                />
                <button onClick={handleAddSubtask}>add subtask</button>
            </div>
        </div>
    );
}
