import React, { forwardRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ExportButton } from "../ExportButton";
import { SUBTASK_TYPE_COLORS } from "../subtasks/SubtaskTypeIcon";

const FALLBACK_COLOR = "#6b7280";

interface SubtaskCategorySectionProps {
    typeCounts: { type: string; count: number }[];
    onExport: () => Promise<void>;
}

export const SubtaskCategorySection = forwardRef<HTMLDivElement, SubtaskCategorySectionProps>(
    function SubtaskCategorySection({ typeCounts, onExport }, ref) {
        const [loading, setLoading] = useState(false);
        const data = typeCounts.map((entry) => ({
            name: entry.type,
            value: entry.count,
            color: SUBTASK_TYPE_COLORS[entry.type] ?? FALLBACK_COLOR,
        }));
        const total = typeCounts.reduce((sum, e) => sum + e.count, 0);

        async function handleExport() {
            setLoading(true);
            try {
                await onExport();
            } finally {
                setLoading(false);
            }
        }

        return (
            <>
                <div className="page-header">
                    <h2>Subtask category breakdown</h2>
                    <ExportButton onClick={handleExport} loading={loading} />
                </div>
                <div ref={ref}>
                    {total > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="complexity-note">No subtasks recorded yet.</p>
                    )}
                </div>
            </>
        );
    }
);

