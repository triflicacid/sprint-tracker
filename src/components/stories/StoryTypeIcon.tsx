import React from "react";
import "./StoryTypeIcon.css";

interface StoryTypeIconProps {
    isBug: boolean;
}

// marks a story as a bug report vs. regular planned work; renders
// unconditionally so every story card/heading gets an entity-type marker.
export function StoryTypeIcon({ isBug }: StoryTypeIconProps): React.ReactElement {
    if (isBug) {
        return (
            <svg
                className="story-type-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e5484d"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <title>bug</title>
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

    return (
        <svg
            className="story-type-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5a9b5a"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <title>story</title>
            <path d="M12 6.5c-2.2-1.7-5.6-1.7-9-0.7v13c3.4-1 6.8-1 9 0.7c2.2-1.7 5.6-1.7 9-0.7v-13c-3.4-1-6.8-1-9 0.7z" />
            <line x1="12" y1="6.5" x2="12" y2="20.2" />
        </svg>
    );
}
