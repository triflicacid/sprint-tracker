import React from "react";
import type { SprintSummary, SprintStats, VelocityPoint } from "@shared/types";
import { ExportButton } from "../ExportButton";

interface SummarySectionProps {
    stats: SprintStats;
    velocitySummary: VelocityPoint | null;
    totalWeekdays: number;
    holidayWeekdays: number;
    selectedSprint: SprintSummary;
    isCompleted: boolean;
    onExport: () => void;
    loading: boolean;
}

// grid of headline stat tiles for the selected sprint.
export function SummarySection({
    stats,
    velocitySummary,
    totalWeekdays,
    holidayWeekdays,
    selectedSprint,
    isCompleted,
    onExport,
    loading,
}: SummarySectionProps) {
    return (
        <>
            <div className="page-header">
                <h2>Summary</h2>
                <ExportButton onClick={onExport} loading={loading} />
            </div>
            <div className="stats-summary">
                <div className="stat-tile">
                    <span className="stat-value">{stats.prCount}</span>
                    <span className="stat-label">pull requests</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{stats.storyCount}</span>
                    <span className="stat-label">stories</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{velocitySummary?.completedPoints ?? 0}</span>
                    <span className="stat-label">velocity (pts)</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{stats.repoCounts.length}</span>
                    <span className="stat-label">repos touched</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{totalWeekdays}</span>
                    <span className="stat-label">sprint days (excl. weekends)</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{holidayWeekdays}</span>
                    <span className="stat-label">holidays</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{selectedSprint.startDate}</span>
                    <span className="stat-label">start date</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{selectedSprint.endDate ?? "ongoing"}</span>
                    <span className="stat-label">end date</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{isCompleted ? "yes" : "ongoing"}</span>
                    <span className="stat-label">completed</span>
                </div>
            </div>
        </>
    );
}
