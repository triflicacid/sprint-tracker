import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Subtask, StatusFlowConfig, StatusHistoryEntry, StoryDetail } from "@shared/types";
import { api } from "../api/client";
import { SubtaskRow } from "../components/subtasks/SubtaskRow";
import { SubtaskFlowDiagram } from "../components/subtasks/SubtaskFlowDiagram";
import { SubtaskTransitionsTable } from "../components/subtasks/SubtaskTransitionsTable";
import { SubtaskActivityCalendar } from "../components/calendar/SubtaskActivityCalendar";
import { CommentEditor } from "../components/CommentEditor";
import { ExportButton } from "../components/ExportButton";
import { exportSectionsAsPdf } from "../utils/pdfExport";
import { buildSubtaskPdfSection } from "../utils/subtaskTiming";
import { buildSubtaskPdfFilename } from "../utils/pdfFilename";
import "./SubtaskDetailPage.css";

// a subtask ("/subtasks/:id"): its row, flow diagram, and activity calendar.
export function SubtaskDetailPage(): React.ReactElement {
    const { id } = useParams<{ id: string }>();
    const subtaskId: number = Number(id);
    const [subtask, setSubtask] = useState<Subtask | null>(null);
    const [story, setStory] = useState<StoryDetail | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [flow, setFlow] = useState<StatusFlowConfig | null>(null);
    const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
    const [exporting, setExporting] = useState<boolean>(false);

    async function loadSubtask() {
        try {
            const [subtaskResult, historyResult] = await Promise.all([
                api.getSubtask(subtaskId),
                api.getSubtaskHistory(subtaskId),
            ]);
            setSubtask(subtaskResult);
            setHistory(historyResult);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "subtask not found");
        }
    }

    useEffect(() => {
        loadSubtask();
    }, [subtaskId]);

    useEffect(() => {
        api.getStatusFlow().then(setFlow);
    }, []);

    useEffect(() => {
        if (!subtask) {
            return;
        }
        api.getStory(subtask.storyId).then(setStory);
    }, [subtask?.storyId]);

    async function saveComment(draft: string) {
        await api.updateSubtask(subtaskId, { comment: draft });
        loadSubtask();
    }

    async function handleExportPdf() {
        if (!subtask || !story) {
            return;
        }
        const subtaskNumber = story.subtasks.findIndex((candidate) => candidate.id === subtaskId) + 1;
        setExporting(true);
        try {
            await exportSectionsAsPdf(
                [buildSubtaskPdfSection(subtask, history)],
                buildSubtaskPdfFilename(story, subtaskNumber)
            );
        } finally {
            setExporting(false);
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
                </div>
                <div className="page-header-actions">
                    <ExportButton onClick={handleExportPdf} loading={exporting} disabled={!story} />
                </div>
            </div>

            <SubtaskRow subtask={subtask} flow={flow} onChanged={loadSubtask} disableNavigation />

            <CommentEditor
                comment={subtask.comment}
                displayClassName="subtask-comment"
                onSave={saveComment}
            />

            <h2>Flow</h2>
            <SubtaskFlowDiagram history={history} />
            <SubtaskTransitionsTable history={history} />

            <h2>Activity calendar</h2>
            <SubtaskActivityCalendar history={history} prUrl={subtask.url} />
        </div>
    );
}
