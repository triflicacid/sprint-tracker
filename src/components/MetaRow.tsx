import React from "react";
import "./MetaRow.css";

// row of small meta items (dates, status, links) shown under a page's h1.
export function MetaRow({ children }: { children: React.ReactNode }) {
    return <div className="story-meta-row">{children}</div>;
}
