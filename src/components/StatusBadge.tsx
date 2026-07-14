import React from "react";
import type { StatusFlowConfig, StoryStatus } from "@shared/types";
import { statusColors, statusLabels, storyStatuses, subtaskStatuses, burndownMilestones } from "@shared/statusCatalog";
import rawStatusFlow from "../../static/statusFlow.json";
import "./StatusBadge.css";

const statusFlow = rawStatusFlow as StatusFlowConfig;

export const SUBTASK_STATUSES = subtaskStatuses(statusFlow);

export const STORY_STATUSES = storyStatuses(statusFlow);

export const STATUS_COLORS = statusColors(statusFlow);

export const STATUS_LABELS = statusLabels(statusFlow);

export const BURNDOWN_MILESTONES = burndownMilestones(statusFlow);

interface StatusBadgeProps {
    status: StoryStatus;
    muted?: boolean;
    onClick?: () => void;
    title?: string;
}

// coloured pill for one subtask/story status.
export function StatusBadge({ status, muted, onClick, title }: StatusBadgeProps) {
    const color = STATUS_COLORS[status];
    const label = STATUS_LABELS[status];
    return (
        <span
            className={muted ? "status-badge status-badge-muted" : "status-badge"}
            style={{ backgroundColor: color }}
            onClick={onClick}
            title={title}
        >
            {label}
        </span>
    );
}
