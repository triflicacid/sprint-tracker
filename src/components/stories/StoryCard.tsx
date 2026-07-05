import React from "react";
import { Link } from "react-router-dom";
import type { StorySummary } from "@shared/types";
import { StatusBadge } from "../StatusBadge";

interface StoryCardProps {
    story: StorySummary;
}

// one story's summary tile, linking to its detail page.
export function StoryCard({ story }: StoryCardProps): React.ReactElement {
    return (
        <div className="story-card">
            <div className="story-card-header">
                <a href={story.jiraUrl} target="_blank" rel="noreferrer" className="story-jira-link">
                    {story.jiraKey ?? story.jiraUrl}
                </a>
                <StatusBadge status={story.status} />
            </div>
            <Link to={`/stories/${story.id}`} className="story-description">
                {story.jiraTitle ?? story.description}
            </Link>
            <div className="story-card-footer">
                <span>{story.prCount} pull requests</span>
                <div className="tag-list">
                    {story.tags.map((tag) => (
                        <span key={tag.id} className={`tag tag-${tag.tagType}`}>
                            {tag.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
