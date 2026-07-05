import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StatusBreakdownPoint } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";

interface StatusBreakdownChartProps {
    points: StatusBreakdownPoint[];
    // ordered status ids to stack, bottom to top
    statuses: string[];
}

// Stacked bar chart of status counts per day
export function StatusBreakdownChart({ points, statuses }: StatusBreakdownChartProps) {
    const data = points.map((point) => ({ date: point.date, ...point.counts }));

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Legend formatter={(value: string) => STATUS_LABELS[value] ?? value.toLowerCase()} />
                {statuses.map((status) => (
                    <Bar
                        key={status}
                        dataKey={status}
                        name={status}
                        stackId="status"
                        fill={STATUS_COLORS[status] ?? "#6b7280"}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
