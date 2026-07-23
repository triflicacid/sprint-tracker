import React from "react";
import { Link } from "react-router-dom";
import type { SearchResultSubtask } from "@shared/types";
import { StatusBadge } from "../StatusBadge";
import { SubtaskTypeIcon, formatSubtaskTypeName } from "../subtasks/SubtaskTypeIcon";
import "./search-result-card.css";

interface SubtaskResultCardProps {
    result: SearchResultSubtask;
}

export function SubtaskResultCard({ result }: SubtaskResultCardProps): React.ReactElement {
    return (
        <Link to={`/subtasks/${result.id}`} className="search-result-card">
            <h3 className="search-result-title">{result.title}</h3>
            <div className="search-result-meta">
                <span>Story: {result.storyJiraKey ?? `#${result.storyId}`}</span>
                <StatusBadge status={result.status} muted />
                <span className="search-result-type">
                    <SubtaskTypeIcon type={result.type} />
                    {formatSubtaskTypeName(result.type)}
                </span>
            </div>
            {result.branchName && <p className="search-result-snippet">Branch: {result.branchName}</p>}
            {result.comment && <p className="search-result-snippet">{result.comment}</p>}
        </Link>
    );
}

