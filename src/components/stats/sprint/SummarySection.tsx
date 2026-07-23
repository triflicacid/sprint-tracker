import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { SprintSummary, SprintStats, VelocityPoint } from "@shared/types";
import { api } from "../../../api/client";
import { ExportButton } from "../../ExportButton";
import { CollapsibleSection } from "../../CollapsibleSection";
import { formatDisplayDate } from "../../../utils/calendarGrid";
import type { PdfSection } from "../../../utils/pdfExport";
import "../statsShared.css";

export interface SummarySectionHandle {
    getReportSection(): PdfSection;
}

interface SummarySectionProps {
    sprintId: number;
    stats: SprintStats;
    selectedSprint: SprintSummary;
    sprintEndDate: string;
    totalWeekdays: number;
    holidayWeekdays: number;
    isCompleted: boolean;
    onExport: () => Promise<void>;
}

// grid of headline stat tiles for the selected sprint.
export const SummarySection = forwardRef<SummarySectionHandle, SummarySectionProps>(function SummarySection(
    { sprintId, stats, selectedSprint, sprintEndDate, totalWeekdays, holidayWeekdays, isCompleted, onExport },
    ref
) {
    const [velocitySummary, setVelocitySummary] = useState<VelocityPoint | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.getVelocityHistory(sprintId, { mode: "lastN", n: 1 }).then((points) => setVelocitySummary(points[0] ?? null));
    }, [sprintId]);

    async function handleExport() {
        setLoading(true);
        try {
            await onExport();
        } finally {
            setLoading(false);
        }
    }

    useImperativeHandle(ref, () => ({
        getReportSection() {
            return {
                title: `Summary - ${selectedSprint.name}`,
                lines: [
                    `Sprint: ${selectedSprint.name} (${formatDisplayDate(selectedSprint.startDate)} to ${formatDisplayDate(sprintEndDate)})`,
                    ...(selectedSprint.project ? [`Project: ${selectedSprint.project}`] : []),
                    `Completed: ${isCompleted ? "yes" : "ongoing"}`,
                    `Pull requests: ${stats.prCount}`,
                    `Stories: ${stats.storyCount}`,
                    `Repos touched: ${stats.repoCounts.length}`,
                    `Sprint days (excl. weekends): ${totalWeekdays}`,
                    `Holidays: ${holidayWeekdays}`,
                    `Velocity: ${velocitySummary?.completedPoints ?? 0} pts${
                        velocitySummary && velocitySummary.unpointedDoneStoryCount > 0
                            ? ` (${velocitySummary.unpointedDoneStoryCount} stories unpointed)`
                            : ""
                    }`,
                ],
            };
        },
    }));

    return (
        <CollapsibleSection title="Summary" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
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
                    <span className="stat-value">{formatDisplayDate(selectedSprint.startDate)}</span>
                    <span className="stat-label">start date</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">
                        {selectedSprint.endDate ? formatDisplayDate(selectedSprint.endDate) : "ongoing"}
                    </span>
                    <span className="stat-label">end date</span>
                </div>
                <div className="stat-tile">
                    <span className="stat-value">{isCompleted ? "yes" : "ongoing"}</span>
                    <span className="stat-label">completed</span>
                </div>
            </div>
        </CollapsibleSection>
    );
});
