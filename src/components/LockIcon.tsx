import React from "react";
import "./LockIcon.css";

interface LockIconProps {
    title?: string;
    open?: boolean;
    onClick?: () => void;
}

/**
 * padlock icon shown next to a title once its sprint has ended, or a manual-lock toggle when
 * `onClick` is supplied
 *
 * color matches the "done" status
 *
 * @param title tooltip text (defaults to "this sprint has ended")
 * @param open shows the shackle open (unlocked) instead of closed
 * @param onClick renders as a clickable toggle instead of a static icon
 */
export function LockIcon({ title = "this sprint has ended", open, onClick }: LockIconProps): React.ReactElement {
    const glyph = (
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
            {open ? <path d="M8 10 V7 A4 4 0 0 1 15.6 5.3" /> : <path d="M8 10 V7 A4 4 0 0 1 16 7 V10" />}
            <rect x="5" y="10" width="14" height="10" rx="2.5" />
            <circle cx="12" cy="14.3" r="1.2" fill="#008300" stroke="none" />
            <line x1="12" y1="15.5" x2="12" y2="17" />
        </svg>
    );

    if (!onClick) {
        return glyph;
    }

    return (
        <button type="button" className="lock-icon-toggle" onClick={onClick} aria-label={title}>
            {glyph}
        </button>
    );
}
