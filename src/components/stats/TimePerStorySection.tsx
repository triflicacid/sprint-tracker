import React, { forwardRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SprintStats } from "@shared/types";
import { ExportButton } from "../ExportButton";
import { CollapsibleSection } from "../CollapsibleSection";

interface TimePerStorySectionProps {
    storyTimeDays: SprintStats["storyTimeDays"];
    onExport: () => Promise<void>;
}

// bar chart of days spent per completed story for the selected sprint.
export const TimePerStorySection = forwardRef<HTMLDivElement, TimePerStorySectionProps>(
    function TimePerStorySection({ storyTimeDays, onExport }, ref) {
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
            <CollapsibleSection title="Time per story (days)" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
                <div ref={ref}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={storyTimeDays} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis type="number" stroke="#9ca3af" />
                            <YAxis type="category" dataKey="storyLabel" stroke="#9ca3af" width={100} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.description ?? ""}
                            />
                            <Bar dataKey="days" fill="#2563eb" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CollapsibleSection>
        );
    }
);
