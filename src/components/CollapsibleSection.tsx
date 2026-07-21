import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import "./CollapsibleSection.css";

interface CollapsibleSectionProps {
    title: string;
    headingLevel?: "h2" | "h3";
    defaultOpen?: boolean;
    // rendered on the right side of the header row (e.g. an export button)
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}

// increment this value (via CollapseAllContext.Provider) to collapse all sections at once
export const CollapseAllContext = createContext<number>(0);
// increment this value (via ExpandAllContext.Provider) to expand all sections at once
export const ExpandAllContext = createContext<number>(0);

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

    // collapse when the parent signals "collapse all" (signal increments each time)
    const collapseSignal = useContext(CollapseAllContext);
    const isFirstCollapseRender = useRef(true);
    useEffect(() => {
        if (isFirstCollapseRender.current) {
            isFirstCollapseRender.current = false;
            return;
        }
        setIsOpen(false);
    }, [collapseSignal]);

    // expand when the parent signals "expand all"
    const expandSignal = useContext(ExpandAllContext);
    const isFirstExpandRender = useRef(true);
    useEffect(() => {
        if (isFirstExpandRender.current) {
            isFirstExpandRender.current = false;
            return;
        }
        setIsOpen(true);
    }, [expandSignal]);

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




