import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { MarkdownExportFields, SprintSummary } from "@shared/types";
import { api } from "../api/client";
import { DatePickerPopover } from "../components/calendar/DatePickerPopover";
import { useToast } from "../components/Toast";
import { ExportButton } from "../components/ExportButton";
import { defaultExportFields, loadExportFields, saveExportFields } from "../utils/exportFields";
import { downloadTextFile } from "../utils/download";
import { formatIsoDate } from "../utils/calendarGrid";
import "./ExportPage.css";

const STORY_FIELD_LABELS: Record<keyof MarkdownExportFields["story"], string> = {
    jiraKey: "Jira key/link",
    title: "Title",
    status: "Status",
    tags: "Tags",
    awaitingMoreSubtasks: "Awaiting more subtasks",
};

const SUBTASK_FIELD_LABELS: Record<keyof MarkdownExportFields["subtask"], string> = {
    title: "Title",
    comment: "Comment",
    branchName: "Branch name",
    prUrl: "Pull request URL",
    status: "Status",
    repoName: "Repo name",
    complexityRating: "Complexity rating",
    releaseVersion: "Release version",
    createdAt: "Created date",
};

// sprint "overlaps" the range if any day of the sprint's run falls within
// [from, to]. an empty bound is treated as unbounded on that side.
function overlapsRange(sprint: SprintSummary, from: string, to: string): boolean {
    const sprintEnd = sprint.endDate ?? "9999-12-31";
    if (from && sprintEnd < from) {
        return false;
    }
    if (to && sprint.startDate > to) {
        return false;
    }
    return true;
}

// "/export": pick sprints (by date range and/or manually) and which story/
// subtask fields to include, then download a markdown file.
export function ExportPage(): React.ReactElement {
    const [sprints, setSprints] = useState<SprintSummary[]>([]);
    const [selectedSprintIds, setSelectedSprintIds] = useState<Set<number>>(new Set());
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [fields, setFields] = useState<MarkdownExportFields>(loadExportFields());
    const [generating, setGenerating] = useState<boolean>(false);
    const { showError } = useToast();

    useEffect(() => {
        api.listSprints().then(setSprints);
    }, []);

    function toggleSprint(id: number) {
        setSelectedSprintIds((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function applyDateRange() {
        if (!fromDate && !toDate) {
            return;
        }
        const matching = sprints.filter((sprint) => overlapsRange(sprint, fromDate, toDate));
        setSelectedSprintIds(new Set(matching.map((sprint) => sprint.id)));
    }

    function updateStoryField(field: keyof MarkdownExportFields["story"], value: boolean) {
        setFields((current) => {
            const next = { ...current, story: { ...current.story, [field]: value } };
            saveExportFields(next);
            return next;
        });
    }

    function updateSubtaskField(field: keyof MarkdownExportFields["subtask"], value: boolean) {
        setFields((current) => {
            const next = { ...current, subtask: { ...current.subtask, [field]: value } };
            saveExportFields(next);
            return next;
        });
    }

    function resetToDefaults() {
        const defaults = defaultExportFields();
        setFields(defaults);
        saveExportFields(defaults);
    }

    async function handleGenerate() {
        if (selectedSprintIds.size === 0) {
            return;
        }
        setGenerating(true);
        try {
            const markdown = await api.exportMarkdown([...selectedSprintIds], fields);
            downloadTextFile(`sprint-export-${formatIsoDate(new Date())}.md`, markdown);
        } catch (error) {
            showError(error instanceof Error ? error.message : "failed to generate export");
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">
                        back to sprints
                    </Link>
                    <h1>Export to markdown</h1>
                </div>
            </div>

            <h2>Sprints</h2>
            <div className="export-date-range">
                <div className="export-date-field">
                    from
                    <DatePickerPopover label="from" value={fromDate} onSelect={setFromDate} />
                </div>
                <div className="export-date-field">
                    to
                    <DatePickerPopover label="to" value={toDate} onSelect={setToDate} />
                </div>
                <button onClick={applyDateRange}>select sprints in range</button>
            </div>

            <div className="export-sprint-list">
                {sprints.map((sprint) => (
                    <label key={sprint.id} className="export-sprint-item">
                        <input
                            type="checkbox"
                            checked={selectedSprintIds.has(sprint.id)}
                            onChange={() => toggleSprint(sprint.id)}
                        />
                        {sprint.name} ({sprint.startDate} &ndash; {sprint.endDate ?? "present"})
                    </label>
                ))}
            </div>

            <h2>Fields to include</h2>
            <div className="export-fields">
                <div className="export-field-group">
                    <h3>Story</h3>
                    {(Object.keys(STORY_FIELD_LABELS) as (keyof MarkdownExportFields["story"])[]).map((field) => (
                        <label key={field} className="export-field-item">
                            <input
                                type="checkbox"
                                checked={fields.story[field]}
                                onChange={(event) => updateStoryField(field, event.target.checked)}
                            />
                            {STORY_FIELD_LABELS[field]}
                        </label>
                    ))}
                </div>
                <div className="export-field-group">
                    <h3>Subtask</h3>
                    {(Object.keys(SUBTASK_FIELD_LABELS) as (keyof MarkdownExportFields["subtask"])[]).map((field) => (
                        <label key={field} className="export-field-item">
                            <input
                                type="checkbox"
                                checked={fields.subtask[field]}
                                onChange={(event) => updateSubtaskField(field, event.target.checked)}
                            />
                            {SUBTASK_FIELD_LABELS[field]}
                        </label>
                    ))}
                </div>
            </div>
            <button onClick={resetToDefaults}>reset to defaults</button>

            <div className="export-actions">
                <ExportButton
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={selectedSprintIds.size === 0}
                    label="generate export"
                    loadingLabel="generating..."
                />
            </div>
        </div>
    );
}
