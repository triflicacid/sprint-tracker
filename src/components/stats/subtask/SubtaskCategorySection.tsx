import React, { forwardRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ExportButton } from "../../ExportButton";
import { CollapsibleSection } from "../../CollapsibleSection";
import { SUBTASK_TYPE_COLORS, formatSubtaskTypeName, renderTypeIconInSvg } from "../../subtasks/SubtaskTypeIcon";

const FALLBACK_COLOR = "#6b7280";
const ICON_SIZE = 18;
const CHAR_WIDTH = 9;
const LABEL_RADIUS_OFFSET = 32;

interface PieLabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    value: number;
    name: string;
}

function renderPieLabel({ cx, cy, midAngle, outerRadius, value, name }: PieLabelProps) {
    const RADIAN = Math.PI / 180;
    const r = outerRadius + LABEL_RADIUS_OFFSET;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    const isRight = x >= cx;
    const textWidth = String(value).length * CHAR_WIDTH;
    const gap = 3;
    const textAnchor = isRight ? "start" : "end";
    const iconX = isRight ? x + textWidth + gap : x + gap;
    const color = SUBTASK_TYPE_COLORS[name] ?? FALLBACK_COLOR;

    return (
        <g key={name}>
            <text x={x} y={y + 5} textAnchor={textAnchor} fontSize={14} fontWeight="600" fill={color}>
                {value}
            </text>
            {renderTypeIconInSvg(name, iconX, y - ICON_SIZE / 2, ICON_SIZE)}
        </g>
    );
}

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
            <CollapsibleSection title="Subtask category breakdown" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
                <div ref={ref}>
                    {total > 0 ? (
                        <ResponsiveContainer width="100%" height={380}>
                            <PieChart margin={{ top: 30, right: 60, bottom: 20, left: 60 }}>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    cy="44%"
                                    label={renderPieLabel}
                                    labelLine={{ stroke: "#888", strokeWidth: 1 }}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                                <Legend formatter={(value) => formatSubtaskTypeName(String(value))} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="complexity-note">No subtasks recorded yet.</p>
                    )}
                </div>
            </CollapsibleSection>
        );
    }
);

