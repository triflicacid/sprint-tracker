import React from "react";
import { Link } from "react-router-dom";
import type { SearchResultStory } from "@shared/types";
import { StatusBadge } from "../StatusBadge";
import "./search-result-card.css";

interface StoryResultCardProps {
    result: SearchResultStory;
}

export function StoryResultCard({ result }: StoryResultCardProps): React.ReactElement {
    const title = result.jiraTitle || result.description;

    return (
        <Link to={`/stories/${result.id}`} className="search-result-card">
            <h3 className="search-result-title">
                {result.jiraKey ? `${result.jiraKey}: ` : ""}
                {title}
            </h3>
            <div className="search-result-meta">
                <span>Sprint: {result.sprintName}</span>
                <StatusBadge status={result.status} muted />
            </div>
            {result.tags.length > 0 && (
                <div className="search-result-tags">Tags: {result.tags.map((tag) => tag.name).join(", ")}</div>
            )}
        </Link>
    );
}

