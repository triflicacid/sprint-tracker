import React from "react";
import { Link } from "react-router-dom";
import type { SearchResultSprint } from "@shared/types";
import { formatDisplayDate } from "../../utils/calendarGrid";
import "./search-result-card.css";

interface SprintResultCardProps {
    result: SearchResultSprint;
}

export function SprintResultCard({ result }: SprintResultCardProps): React.ReactElement {
    return (
        <Link to={`/sprints/${result.id}`} className="search-result-card">
            <h3 className="search-result-title">{result.name}</h3>
            <div className="search-result-meta">
                <span>
                    {formatDisplayDate(result.startDate)} - {result.endDate ? formatDisplayDate(result.endDate) : "present"}
                </span>
                {result.project && <span className="project-tag">{result.project}</span>}
            </div>
            {result.comment && <p className="search-result-snippet">{result.comment}</p>}
        </Link>
    );
}

