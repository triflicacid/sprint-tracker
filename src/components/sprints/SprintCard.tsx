import React from "react";
import { Link } from "react-router-dom";
import type { SprintSummary } from "@shared/types";

interface SprintCardProps {
    sprint: SprintSummary;
}

// one sprint's summary tile, linking to its detail page.
export function SprintCard({ sprint }: SprintCardProps): React.ReactElement {
    const dateRange: string = sprint.endDate
        ? `${sprint.startDate} to ${sprint.endDate}`
        : `${sprint.startDate} to present`;

    return (
        <Link to={`/sprints/${sprint.id}`} className="sprint-card">
            <div className="sprint-card-header">
                <h3>{sprint.name}</h3>
                <span className="sprint-card-dates">{dateRange}</span>
            </div>
            {sprint.comment && <p className="sprint-card-comment">{sprint.comment}</p>}
            <div className="sprint-card-stats">
                <span>{sprint.storyCount} stories</span>
                <span>{sprint.prCount} pull requests</span>
            </div>
        </Link>
    );
}
