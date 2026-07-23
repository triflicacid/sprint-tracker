import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { StatusBreakdownPoint, StatusBreakdownGranularity, StoryStatus, SubtaskStatus } from "@shared/types";
import { api } from "../../../api/client";
import { BurndownSection } from "./BurndownSection";
import { StatusBreakdownSection } from "./StatusBreakdownSection";
import { SUBTASK_STATUSES, STORY_STATUSES, STATUS_LABELS, BURNDOWN_MILESTONES } from "../../StatusBadge";
import { computeBurndownPoints, computeAdvancedBurndownPoints } from "../../../utils/burndown";
import { formatDisplayDate } from "../../../utils/calendarGrid";
import type { PdfSection } from "../../../utils/pdfExport";

// renders one day's status tally as "label: count, label: count", skipping zeros
function describeStatusCounts(counts: Record<string, number>, statusLabels: StoryStatus[]) {
    const parts = statusLabels
        .filter((status) => (counts[status] ?? 0) > 0)
        .map((status) => `${STATUS_LABELS[status]}: ${counts[status]}`);
    return parts.length > 0 ? parts.join(", ") : "no statuses recorded";
}

// renders one day's remaining-until-milestone counts as "label: count, label: count"
function describeMilestones(counts: Record<string, number>, milestones: SubtaskStatus[]) {
    return milestones.map((milestone) => `${STATUS_LABELS[milestone]}: ${counts[milestone] ?? 0}`).join(", ");
}

export interface StatusHistorySectionHandle {
    // the Burndown and Status breakdown pdf sections, in that order
    getReportSections(): [PdfSection, PdfSection];
}

interface StatusHistorySectionProps {
    sprintId: number;
    isWorkingDay: (date: string) => boolean;
    onExportBurndown: () => Promise<void>;
    onExportStatusBreakdown: () => Promise<void>;
}
// burndowns + status breakdown
export const StatusHistorySection = forwardRef<StatusHistorySectionHandle, StatusHistorySectionProps>(
    function StatusHistorySection({ sprintId, isWorkingDay, onExportBurndown, onExportStatusBreakdown }, ref) {
        const [granularity, setGranularity] = useState<StatusBreakdownGranularity>("subtask");
        const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownPoint[]>([]);

        const burndownExportRef = useRef<HTMLDivElement>(null);
        const statusBreakdownRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            api.getStatusBreakdown(sprintId, granularity).then(setStatusBreakdown);
        }, [sprintId, granularity]);

        const burndownPoints = computeBurndownPoints(statusBreakdown, isWorkingDay);
        const advancedBurndownPoints = computeAdvancedBurndownPoints(
            statusBreakdown,
            granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES,
            BURNDOWN_MILESTONES,
            isWorkingDay
        );

        useImperativeHandle(ref, () => ({
            getReportSections() {
                const statusLabels = granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES;
                const firstBreakdown = statusBreakdown[0];
                const lastBreakdown = statusBreakdown[statusBreakdown.length - 1];
                const firstBurndown = burndownPoints[0];
                const lastBurndown = burndownPoints[burndownPoints.length - 1];
                const firstAdvancedBurndown = advancedBurndownPoints[0];
                const lastAdvancedBurndown = advancedBurndownPoints[advancedBurndownPoints.length - 1];

                const burndownSection: PdfSection = {
                    title: "Burndown",
                    element: burndownExportRef.current ?? undefined,
                    lines: !firstBurndown
                        ? ["No status history recorded yet."]
                        : firstBurndown.date === lastBurndown.date
                          ? [
                                `${formatDisplayDate(firstBurndown.date)}: ${firstBurndown.actual} remaining (ideal ${firstBurndown.ideal})`,
                                `Milestones remaining (${formatDisplayDate(firstAdvancedBurndown.date)}): ${describeMilestones(firstAdvancedBurndown.counts, BURNDOWN_MILESTONES)}`,
                            ]
                          : [
                                `Start (${formatDisplayDate(firstBurndown.date)}): ${firstBurndown.actual} remaining (ideal ${firstBurndown.ideal})`,
                                `End (${formatDisplayDate(lastBurndown.date)}): ${lastBurndown.actual} remaining (ideal ${lastBurndown.ideal})`,
                                `Milestones remaining at start (${formatDisplayDate(firstAdvancedBurndown.date)}): ${describeMilestones(firstAdvancedBurndown.counts, BURNDOWN_MILESTONES)}`,
                                `Milestones remaining at end (${formatDisplayDate(lastAdvancedBurndown.date)}): ${describeMilestones(lastAdvancedBurndown.counts, BURNDOWN_MILESTONES)}`,
                            ],
                };

                const statusBreakdownSection: PdfSection = {
                    title: `Status breakdown (${granularity === "story" ? "stories" : granularity + "s"})`,
                    element: statusBreakdownRef.current ?? undefined,
                    lines: !firstBreakdown
                        ? ["No status history recorded yet."]
                        : firstBreakdown.date === lastBreakdown.date
                          ? [
                                `${formatDisplayDate(firstBreakdown.date)}: ${describeStatusCounts(firstBreakdown.counts, statusLabels)}`,
                            ]
                          : [
                                `Start (${formatDisplayDate(firstBreakdown.date)}): ${describeStatusCounts(firstBreakdown.counts, statusLabels)}`,
                                `End (${formatDisplayDate(lastBreakdown.date)}): ${describeStatusCounts(lastBreakdown.counts, statusLabels)}`,
                            ],
                };

                return [burndownSection, statusBreakdownSection];
            },
        }));

        return (
            <>
                <BurndownSection
                    ref={burndownExportRef}
                    granularity={granularity}
                    setGranularity={setGranularity}
                    burndownPoints={burndownPoints}
                    advancedBurndownPoints={advancedBurndownPoints}
                    onExport={onExportBurndown}
                />
                <StatusBreakdownSection
                    ref={statusBreakdownRef}
                    points={statusBreakdown}
                    granularity={granularity}
                    onExport={onExportStatusBreakdown}
                />
            </>
        );
    }
);
