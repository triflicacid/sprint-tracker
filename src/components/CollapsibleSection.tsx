import React, { useState } from "react";
import "./CollapsibleSection.css";

interface CollapsibleSectionProps {
    title: string;
    headingLevel?: "h2" | "h3";
    defaultOpen?: boolean;
    // rendered on the right side of the header row (e.g. an export button)
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}

// simple right-pointing chevron; the parent span rotates it to point down when open
function Chevron() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <polyline
                points="6,3 11,8 6,13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// section with a clickable title row that collapses/expands its body
export function CollapsibleSection({
    title,
    headingLevel = "h2",
    defaultOpen = true,
    headerActions,
    children,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const Heading = headingLevel;

    return (
        <div className="collapsible-section">
            <div className="collapsible-section-header">
                <button
                    className="collapsible-section-trigger"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-expanded={isOpen}
                >
                    <span className={`collapsible-chevron${isOpen ? "" : " closed"}`}>
                        <Chevron />
                    </span>
                    <Heading className="collapsible-section-heading">{title}</Heading>
                </button>
                {headerActions}
            </div>
            {isOpen ? children : <hr className="section-collapsed-rule" />}
        </div>
    );
}
