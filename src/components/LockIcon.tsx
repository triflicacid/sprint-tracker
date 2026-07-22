import React from "react";
import "./LockIcon.css";

interface LockIconProps {
    title?: string;
}

// padlock shown next to a sprint/story/subtask's title once its sprint has
// ended; color matches the "done" status lozenge (see static/status_flow.json).
export function LockIcon({ title = "this sprint has ended" }: LockIconProps): React.ReactElement {
    return (
        <svg
            className="lock-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#008300"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <title>{title}</title>
            <path d="M8 10 V7 A4 4 0 0 1 16 7 V10" />
            <rect x="5" y="10" width="14" height="10" rx="2.5" />
            <circle cx="12" cy="14.3" r="1.2" fill="#008300" stroke="none" />
            <line x1="12" y1="15.5" x2="12" y2="17" />
        </svg>
    );
}
