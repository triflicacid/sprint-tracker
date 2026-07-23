import React from "react";
import { Link } from "react-router-dom";
import type { SprintSummary } from "@shared/types";
import { formatDisplayDate } from "../../utils/calendarGrid";
import "./SprintCard.css";

interface SprintCardProps {
    sprint: SprintSummary;
}

/**
 * sprint summary tile linking to its detail page
 *
 * @param sprint the sprint to display
 */
export function SprintCard({ sprint }: SprintCardProps): React.ReactElement {
    const dateRange: string = sprint.endDate
        ? `${formatDisplayDate(sprint.startDate)} to ${formatDisplayDate(sprint.endDate)}`
        : `${formatDisplayDate(sprint.startDate)} to present`;

    return (
        <Link to={`/sprints/${sprint.id}`} className="sprint-card">
            <div className="sprint-card-header">
                <h3>{sprint.name}</h3>
                <span className="sprint-card-dates">{dateRange}</span>
            </div>
            {sprint.project && <span className="project-tag">{sprint.project}</span>}
            {sprint.comment && <p className="sprint-card-comment">{sprint.comment}</p>}
            <div className="sprint-card-stats">
                <span>{sprint.storyCount} stories</span>
                <span>{sprint.prCount} pull requests</span>
            </div>
        </Link>
    );
}
