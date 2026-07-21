import React from "react";
import "./SubtaskTypeIcon.css";

export const SUBTASK_TYPE_COLORS: Record<string, string> = {
    unknown: "#6b7280",
    feature: "#22a6b3",
    bugfix: "#e5484d",
    "tech-debt": "#a1662f",
    spike: "#7c6fe0",
};

interface SubtaskTypeIconProps {
    type: string;
}

export function SubtaskTypeIcon({ type }: SubtaskTypeIconProps): React.ReactElement | null {
    if (type === "unknown") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <title>unknown</title>
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="12" y2="16" />
            </svg>
        );
    }
    if (type === "feature") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="#22a6b3">
                <title>feature</title>
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
            </svg>
        );
    }
    if (type === "bugfix") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#e5484d" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <title>bugfix</title>
                <path d="M8 4 L6.3 2.3" />
                <path d="M16 4 L17.7 2.3" />
                <circle cx="12" cy="5.2" r="2.1" />
                <line x1="12" y1="7.3" x2="12" y2="9" />
                <rect x="7" y="9" width="10" height="11" rx="5" />
                <line x1="7" y1="11.5" x2="2.8" y2="9.8" />
                <line x1="7" y1="14.5" x2="2" y2="14.5" />
                <line x1="7" y1="17.5" x2="2.8" y2="19.2" />
                <line x1="17" y1="11.5" x2="21.2" y2="9.8" />
                <line x1="17" y1="14.5" x2="22" y2="14.5" />
                <line x1="17" y1="17.5" x2="21.2" y2="19.2" />
            </svg>
        );
    }
    if (type === "tech-debt") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="#a1662f">
                <title>tech-debt</title>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
            </svg>
        );
    }
    if (type === "spike") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#7c6fe0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <title>spike</title>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <line x1="15.5" y1="15.5" x2="21" y2="21" />
            </svg>
        );
    }
    return null;
}

