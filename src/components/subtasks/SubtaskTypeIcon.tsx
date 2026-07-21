import React from "react";
import "./SubtaskTypeIcon.css";

export const SUBTASK_TYPE_COLORS: Record<string, string> = {
    unknown: "#6b7280",
    feature: "#22a6b3",
    bugfix: "#e5484d",
    "tech-debt": "#a1662f",
    spike: "#7c6fe0",
    chore: "#8c9c52",
    docs: "#7b93b0",
    test: "#5cae8a",
    security: "#9d6fd1",
    perf: "#c9648f",
};

// "tech-debt" → "Tech debt", "feature" → "Feature", etc.
export function formatSubtaskTypeName(shortName: string): string {
    const s = shortName.replace(/-/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// renders the type icon as a positioned <svg> element suitable for embedding
// inside an existing SVG context (e.g. a Recharts custom label).
// (x, y) is the top-left corner; size is width/height in SVG user units.
export function renderTypeIconInSvg(type: string, x: number, y: number, size: number): React.ReactElement | null {
    const base = { x, y, width: size, height: size, viewBox: "0 0 24 24" };
    if (type === "unknown") {
        return (
            <svg {...base} fill="none" stroke="#6b7280" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="12" y2="16" />
            </svg>
        );
    }
    if (type === "feature") {
        return (
            <svg {...base} fill="#22a6b3">
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
            </svg>
        );
    }
    if (type === "bugfix") {
        return (
            <svg {...base} fill="none" stroke="#e5484d" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4 L6.3 2.3" /><path d="M16 4 L17.7 2.3" />
                <circle cx="12" cy="5.2" r="2.1" />
                <line x1="12" y1="7.3" x2="12" y2="9" />
                <rect x="7" y="9" width="10" height="11" rx="5" />
                <line x1="7" y1="11.5" x2="2.8" y2="9.8" /><line x1="7" y1="14.5" x2="2" y2="14.5" /><line x1="7" y1="17.5" x2="2.8" y2="19.2" />
                <line x1="17" y1="11.5" x2="21.2" y2="9.8" /><line x1="17" y1="14.5" x2="22" y2="14.5" /><line x1="17" y1="17.5" x2="21.2" y2="19.2" />
            </svg>
        );
    }
    if (type === "tech-debt") {
        return (
            <svg {...base} fill="#a1662f">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
            </svg>
        );
    }
    if (type === "spike") {
        return (
            <svg {...base} fill="none" stroke="#7c6fe0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <line x1="15.5" y1="15.5" x2="21" y2="21" />
            </svg>
        );
    }
    if (type === "chore") {
        return (
            <svg {...base} fill="none" stroke="#8c9c52" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }
    if (type === "docs") {
        return (
            <svg {...base} fill="none" stroke="#7b93b0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
        );
    }
    if (type === "test") {
        return (
            <svg {...base} fill="none" stroke="#5cae8a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="m9 14 2 2 4-4" />
            </svg>
        );
    }
    if (type === "security") {
        return (
            <svg {...base} fill="none" stroke="#9d6fd1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        );
    }
    if (type === "perf") {
        return (
            <svg {...base} fill="#c9648f">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        );
    }
    return null;
}

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
    if (type === "chore") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#8c9c52" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <title>chore</title>
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }
    if (type === "docs") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#7b93b0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <title>docs</title>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
        );
    }
    if (type === "test") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#5cae8a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <title>test</title>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="m9 14 2 2 4-4" />
            </svg>
        );
    }
    if (type === "security") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="none" stroke="#9d6fd1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <title>security</title>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        );
    }
    if (type === "perf") {
        return (
            <svg className="subtask-type-icon" viewBox="0 0 24 24" fill="#c9648f">
                <title>perf</title>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        );
    }
    return null;
}

