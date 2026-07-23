import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SubtaskStatus } from "@shared/types";
import type { AdvancedBurndownPoint } from "#utils/burndown";
import { STATUS_COLORS, STATUS_LABELS } from "../../StatusBadge";
import { formatDisplayDate } from "#utils/calendarGrid";

interface AdvancedBurndownChartProps {
    points: AdvancedBurndownPoint[];
    // milestone status ids to draw, one line each
    milestones: SubtaskStatus[];
}

// One line per milestone status: how many items have not yet reached it each day
export function AdvancedBurndownChart({ points, milestones }: AdvancedBurndownChartProps) {
    const data = points.map((point) => ({ date: formatDisplayDate(point.date), ideal: point.ideal, ...point.counts }));

    return (
        <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Legend formatter={(value: string) => (value === "ideal" ? "ideal" : STATUS_LABELS[value as SubtaskStatus])} />
                {milestones.map((milestone) => (
                    <Line
                        key={milestone}
                        type="monotone"
                        dataKey={milestone}
                        name={milestone}
                        stroke={STATUS_COLORS[milestone]}
                        strokeWidth={2}
                        dot={false}
                    />
                ))}
                <Line
                    type="monotone"
                    dataKey="ideal"
                    name="ideal"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
