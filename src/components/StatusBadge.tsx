import React from "react";
import type { StatusFlowConfig, SubtaskStatus, StoryStatus } from "@shared/types";
import rawStatusFlow from "../../static/statusFlow.json";

const statusFlow = rawStatusFlow as StatusFlowConfig;

export const SUBTASK_STATUSES = statusFlow.states.map(
    (state) => state.id
) as SubtaskStatus[];

export const STORY_STATUSES: StoryStatus[] = ["JIRA_ONLY", "WORK_REMAINING", ...SUBTASK_STATUSES];

export const STATUS_COLORS: Record<string, string> = {
    ...Object.fromEntries(statusFlow.states.map((state) => [state.id, state.color])),
    JIRA_ONLY: "#6b7280",
    WORK_REMAINING: "#8b7355",
};

export const STATUS_LABELS: Record<string, string> = {
    ...Object.fromEntries(statusFlow.states.map((state) => [state.id, state.label])),
    JIRA_ONLY: "jira only",
    WORK_REMAINING: "work remaining",
};

interface StatusBadgeProps {
    status: string;
    muted?: boolean;
    onClick?: () => void;
}

// coloured pill for one subtask/story status.
export function StatusBadge({ status, muted, onClick }: StatusBadgeProps) {
    const color = STATUS_COLORS[status] ?? "#6b7280";
    const label = STATUS_LABELS[status] ?? status.toLowerCase();
    return (
        <span
            className={muted ? "status-badge status-badge-muted" : "status-badge"}
            style={{ backgroundColor: color }}
            onClick={onClick}
        >
            {label}
        </span>
    );
}
