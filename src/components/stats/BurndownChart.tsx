import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { BurndownPoint } from "../../utils/burndown";

interface BurndownChartProps {
    points: BurndownPoint[];
}

// Actual vs ideal remaining-work line chart for a sprint burndown.
export function BurndownChart({ points }: BurndownChartProps) {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Legend />
                <Line type="monotone" dataKey="actual" name="actual" stroke="#d97706" strokeWidth={2} dot={false} />
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
