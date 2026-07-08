import React, { forwardRef } from "react";
import type { StatusBreakdownPoint, StatusBreakdownGranularity } from "@shared/types";
import { StatusBreakdownChart } from "./StatusBreakdownChart";
import { ExportButton } from "../ExportButton";
import { SUBTASK_STATUSES, STORY_STATUSES } from "../StatusBadge";

interface StatusBreakdownSectionProps {
    points: StatusBreakdownPoint[];
    granularity: StatusBreakdownGranularity;
    onExport: () => void;
    loading: boolean;
}

// stacked bar chart of status counts per day for the selected sprint.
export const StatusBreakdownSection = forwardRef<HTMLDivElement, StatusBreakdownSectionProps>(
    function StatusBreakdownSection({ points, granularity, onExport, loading }, ref) {
        return (
            <>
                <div className="page-header">
                    <h2>Status breakdown</h2>
                    <ExportButton onClick={onExport} loading={loading} />
                </div>
                <div ref={ref}>
                    <StatusBreakdownChart
                        points={points}
                        statuses={granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES}
                    />
                </div>
            </>
        );
    }
);
