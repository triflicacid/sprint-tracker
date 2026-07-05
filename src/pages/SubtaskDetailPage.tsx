import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Subtask, StatusFlowConfig, StatusHistoryEntry } from "@shared/types";
import { api } from "../api/client";
import { SubtaskRow } from "../components/subtasks/SubtaskRow";
import { SubtaskFlowDiagram } from "../components/subtasks/SubtaskFlowDiagram";
import { SubtaskActivityCalendar } from "../components/calendar/SubtaskActivityCalendar";

// a subtask ("/subtasks/:id"): its row, flow diagram, and activity calendar.
export function SubtaskDetailPage(): React.ReactElement {
    const { id } = useParams<{ id: string }>();
    const subtaskId: number = Number(id);
    const [subtask, setSubtask] = useState<Subtask | null>(null);
    const [flow, setFlow] = useState<StatusFlowConfig | null>(null);
    const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
    const [editingComment, setEditingComment] = useState<boolean>(false);
    const [commentDraft, setCommentDraft] = useState<string>("");

    async function loadSubtask() {
        const [subtaskResult, historyResult] = await Promise.all([
            api.getSubtask(subtaskId),
            api.getSubtaskHistory(subtaskId),
        ]);
        setSubtask(subtaskResult);
        setHistory(historyResult);
    }

    useEffect(() => {
        loadSubtask();
    }, [subtaskId]);

    useEffect(() => {
        api.getStatusFlow().then(setFlow);
    }, []);

    function startEditingComment() {
        setCommentDraft(subtask?.comment ?? "");
        setEditingComment(true);
    }

    async function saveComment() {
        await api.updateSubtask(subtaskId, { comment: commentDraft.trim() });
        setEditingComment(false);
        loadSubtask();
    }

    if (!subtask || !flow) {
        return <div className="page">loading...</div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to={`/stories/${subtask.storyId}`} className="back-link">
                        back to story
                    </Link>
                    <h1>{subtask.title}</h1>
                    {editingComment ? (
                        <textarea
                            className="comment-edit"
                            value={commentDraft}
                            autoFocus
                            onChange={(event) => setCommentDraft(event.target.value)}
                            onBlur={saveComment}
                        />
                    ) : (
                        <p className="subtask-comment subtask-comment-editable" onClick={startEditingComment}>
                            {subtask.comment || "add comment"}
                        </p>
                    )}
                </div>
            </div>

            <SubtaskRow subtask={subtask} flow={flow} onChanged={loadSubtask} disableNavigation />

            <h2>Flow</h2>
            <SubtaskFlowDiagram flow={flow} history={history} />

            <h2>Activity calendar</h2>
            <SubtaskActivityCalendar history={history} prUrl={subtask.url} />
        </div>
    );
}
