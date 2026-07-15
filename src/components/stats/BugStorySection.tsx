import React, { forwardRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ExportButton } from "../ExportButton";

interface BugStorySectionProps {
    storyCount: number;
    bugCount: number;
    onExport: () => Promise<void>;
}

const STORY_COLOR = "#5a9b5a";
const BUG_COLOR = "#e5484d";

// pie chart of bug vs. (non-bug) story counts for the selected sprint.
export const BugStorySection = forwardRef<HTMLDivElement, BugStorySectionProps>(
    function BugStorySection({ storyCount, bugCount, onExport }, ref) {
        const [loading, setLoading] = useState(false);
        const nonBugCount = storyCount - bugCount;
        const data = [
            { name: "story", value: nonBugCount, color: STORY_COLOR },
            { name: "bug", value: bugCount, color: BUG_COLOR },
        ];

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
                    <h2>Bugs vs stories</h2>
                    <ExportButton onClick={handleExport} loading={loading} />
                </div>
                <div ref={ref}>
                    {storyCount > 0 ? (
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
                        <p className="complexity-note">No stories recorded yet.</p>
                    )}
                </div>
            </>
        );
    }
);
