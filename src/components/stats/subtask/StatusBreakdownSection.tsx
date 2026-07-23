import React, { forwardRef, useState } from "react";
import type { StatusBreakdownPoint, StatusBreakdownGranularity } from "@shared/types";
import { StatusBreakdownChart } from "./StatusBreakdownChart";
import { ExportButton } from "../../ExportButton";
import { CollapsibleSection } from "../../CollapsibleSection";
import { SUBTASK_STATUSES, STORY_STATUSES } from "../../StatusBadge";

interface StatusBreakdownSectionProps {
    points: StatusBreakdownPoint[];
    granularity: StatusBreakdownGranularity;
    onExport: () => Promise<void>;
}

// stacked bar chart of status counts per day for the selected sprint.
export const StatusBreakdownSection = forwardRef<HTMLDivElement, StatusBreakdownSectionProps>(
    function StatusBreakdownSection({ points, granularity, onExport }, ref) {
        const [loading, setLoading] = useState(false);

        async function handleExport() {
            setLoading(true);
            try {
                await onExport();
            } finally {
                setLoading(false);
            }
        }

        return (
            <CollapsibleSection title="Status breakdown" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
                <div ref={ref}>
                    <StatusBreakdownChart
                        points={points}
                        statuses={granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES}
                    />
                </div>
            </CollapsibleSection>
        );
    }
);
