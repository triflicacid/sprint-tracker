import React, { forwardRef, useState, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bar, ComposedChart, Line, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import type { VelocityPoint } from "@shared/types";
import { ExportButton } from "../ExportButton";
import { CollapsibleSection } from "../CollapsibleSection";
import "./statsShared.css";

// chart also contains computed average
interface VelocityChartPoint extends VelocityPoint {
    averageVelocity: number;
}

function VelocityTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { payload: VelocityChartPoint }[];
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }
    const point = payload[0].payload;
    return (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", padding: "6px 10px" }}>
            <div>{point.sprintName}</div>
            <div>
                {point.completedPoints} pt{point.completedPoints === 1 ? "" : "s"}
                {point.unpointedDoneStoryCount > 0 ? ` (${point.unpointedDoneStoryCount} stories unpointed)` : ""}
            </div>
            <div>
                {point.completedStoryCount} stor{point.completedStoryCount === 1 ? "y" : "ies"}, {point.completedSubtaskCount} subtask
                {point.completedSubtaskCount === 1 ? "" : "s"} done
            </div>
            <div>average so far: {point.averageVelocity} pts</div>
        </div>
    );
}

// calculate the average velocity of all given sprints
function averageVelocity(points: VelocityPoint[]) {
    return points.length === 0
        ? undefined
        : Math.round(points.map((point => point.completedPoints)).reduce((a, b) => a + b) / points.length * 10) / 10;
}

export interface VelocityOverviewHandle {
    getChartElement(): HTMLDivElement | null;
}

interface VelocityOverviewProps {
    velocityPoints: VelocityPoint[];
    latestSprintId: number;
    onExport: () => Promise<void>;
}

/**
 * velocity bar chart with running average line
 *
 * shows completed points per sprint with an overlay showing the cumulative average
 */
export const VelocityOverview = forwardRef<VelocityOverviewHandle, VelocityOverviewProps>(
    function VelocityOverview({ velocityPoints, latestSprintId, onExport }, ref) {
        const navigate = useNavigate();
        const [loading, setLoading] = useState(false);
        const chartRef = React.useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            getChartElement() {
                return chartRef.current;
            },
        }));

        // running average of completedPoints
        const velocityChartData: VelocityChartPoint[] = velocityPoints.map((point, index) => {
            const pointsSoFar = velocityPoints.slice(0, index + 1);
            const average = pointsSoFar.reduce((sum, p) => sum + p.completedPoints, 0) / pointsSoFar.length;
            return { ...point, averageVelocity: Math.round(average * 10) / 10 };
        });

        async function handleExport() {
            setLoading(true);
            try {
                await onExport();
            } finally {
                setLoading(false);
            }
        }

        return (
            <CollapsibleSection
                title="Velocity"
                headerActions={<ExportButton onClick={handleExport} loading={loading} />}
            >
                <div ref={chartRef}>
                    {velocityChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={velocityChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis dataKey="sprintName" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" allowDecimals={false} />
                                <Tooltip content={<VelocityTooltip />} />
                                <Legend />
                                <Bar
                                    dataKey="completedPoints"
                                    name="completed points"
                                    cursor="pointer"
                                    onClick={(data: { payload?: VelocityChartPoint }) =>
                                        data.payload && navigate(`/stats/${data.payload.sprintId}`)
                                    }
                                >
                                    {velocityChartData.map((point) => (
                                        <Cell
                                            key={point.sprintId}
                                            fill={point.sprintId === latestSprintId ? "#facc15" : "#16a34a"}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="unpointedDoneStoryCount"
                                        position="top"
                                        fill="#9ca3af"
                                        formatter={(label) => (Number(label) > 0 ? `${label} unpointed` : "")}
                                    />
                                </Bar>
                                <Line
                                    type="monotone"
                                    dataKey="averageVelocity"
                                    name="average velocity"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#ef4444" }}
                                    isAnimationActive={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="complexity-note">No sprints in this selection yet.</p>
                    )}
                </div>
                {velocityPoints.length > 0 && (
                    <p>The average velocity within the selection is {averageVelocity(velocityPoints)} points per sprint</p>
                )}
            </CollapsibleSection>
        );
    }
);

