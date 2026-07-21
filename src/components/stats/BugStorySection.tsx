import React, { forwardRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ExportButton } from "../ExportButton";
import { CollapsibleSection } from "../CollapsibleSection";

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
            <CollapsibleSection title="Bugs vs stories" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
                <div ref={ref}>
                    {storyCount > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart margin={{ top: 30, right: 30, bottom: 10, left: 30 }}>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label={({ cx, cy, midAngle, outerRadius, name, value }: { cx: number; cy: number; midAngle: number; outerRadius: number; name: string; value: number }) => {
                                        const RADIAN = Math.PI / 180;
                                        const r = outerRadius + 30;
                                        const x = cx + r * Math.cos(-midAngle * RADIAN);
                                        const y = cy + r * Math.sin(-midAngle * RADIAN);
                                        const color = name === "bug" ? BUG_COLOR : STORY_COLOR;
                                        const displayName = String(name).charAt(0).toUpperCase() + String(name).slice(1);
                                        return (
                                            <text key={name} x={x} y={y + 5} textAnchor={x > cx ? "start" : "end"} fontSize={14} fontWeight="600" fill={color}>
                                                {`${displayName}: ${value}`}
                                            </text>
                                        );
                                    }}
                                    labelLine={false}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                                <Legend formatter={(value) => String(value).charAt(0).toUpperCase() + String(value).slice(1)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="complexity-note">No stories recorded yet.</p>
                    )}
                </div>
            </CollapsibleSection>
        );
    }
);
