import React, { useEffect, useRef, useState } from "react";
import { Bar, ComposedChart, Line, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SprintSummary, VelocityPoint, VelocitySelection } from "@shared/types";
import { api } from "../../api/client";
import { ExportButton } from "../ExportButton";
import { formatIsoDate } from "../../utils/calendarGrid";
import { exportSectionsAsPdf, type PdfSection } from "../../utils/pdfExport";
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

// describes which sprints a velocity selection covers, for the pdf report.
function describeVelocitySelection(selection: VelocitySelection): string {
    if (selection.mode === "range") {
        return `${selection.from || "?"} to ${selection.to || "?"}`;
    }
    if (selection.mode === "lastN") {
        return `last ${selection.n} sprints`;
    }
    return "all sprints";
}

// calculate the average velocity of all given sprints
function averageVelocity(points: VelocityPoint[]) {
    return points.length === 0
        ? undefined
        : Math.round(points.map((point => point.completedPoints)).reduce((a, b) => a + b) / points.length * 10) / 10;
}

interface VelocitySectionProps {
    sprints: SprintSummary[];
    latestSprintId: number;
}

export function VelocitySection({ sprints, latestSprintId }: VelocitySectionProps) {
    const [velocityMode, setVelocityMode] = useState<VelocitySelection["mode"]>("lastN");
    const [velocityN, setVelocityN] = useState<number>(5);
    const [velocityRangeFrom, setVelocityRangeFrom] = useState<string>("");
    const [velocityRangeTo, setVelocityRangeTo] = useState<string>("");
    const [velocityPoints, setVelocityPoints] = useState<VelocityPoint[]>([]);
    const [exporting, setExporting] = useState(false);

    const velocityChartRef = useRef<HTMLDivElement>(null);

    // velocity range defaults
    useEffect(() => {
        if (sprints.length === 0 || velocityRangeFrom || velocityRangeTo) {
            return;
        }
        const sorted = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate));
        const lastFive = sorted.slice(-5);
        setVelocityRangeFrom(lastFive[0]?.startDate ?? "");
        setVelocityRangeTo(formatIsoDate(new Date()));
    }, [sprints]);

    const velocitySelection: VelocitySelection =
        velocityMode === "range"
            ? { mode: "range", from: velocityRangeFrom, to: velocityRangeTo }
            : velocityMode === "lastN"
              ? { mode: "lastN", n: velocityN }
              : { mode: "all" };

    useEffect(() => {
        api.getVelocityHistory(latestSprintId, velocitySelection).then(setVelocityPoints);
    }, [latestSprintId, velocityMode, velocityN, velocityRangeFrom, velocityRangeTo]);

    // running average of completedPoints
    const velocityChartData: VelocityChartPoint[] = velocityPoints.map((point, index) => {
        const pointsSoFar = velocityPoints.slice(0, index + 1);
        const average = pointsSoFar.reduce((sum, p) => sum + p.completedPoints, 0) / pointsSoFar.length;
        return { ...point, averageVelocity: Math.round(average * 10) / 10 };
    });

    async function handleExportVelocity() {
        setExporting(true);
        try {
            const section: PdfSection = {
                title: "Velocity",
                element: velocityChartRef.current ?? undefined,
                lines: [
                    `Showing: ${describeVelocitySelection(velocitySelection)}`,
                    ...(velocityPoints.length > 0
                        ? velocityPoints.map(
                              (point) =>
                                  `${point.sprintName}: ${point.completedPoints} pts (${point.unpointedDoneStoryCount} stories unpointed)`
                          )
                        : ["No sprints in this selection."]),
                    `Average velocity: ${averageVelocity(velocityPoints) ?? 'N/A'}`,
                ],
            };
            await exportSectionsAsPdf([section], `velocity-${formatIsoDate(new Date())}.pdf`);
        } finally {
            setExporting(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <h2>Velocity</h2>
                <div className="page-header-actions">
                    <div className="granularity-toggle">
                        <button
                            className={velocityMode === "all" ? "active" : ""}
                            onClick={() => setVelocityMode("all")}
                        >
                            all sprints
                        </button>
                        <button
                            className={velocityMode === "range" ? "active" : ""}
                            onClick={() => setVelocityMode("range")}
                        >
                            date range
                        </button>
                        <button
                            className={velocityMode === "lastN" ? "active" : ""}
                            onClick={() => setVelocityMode("lastN")}
                        >
                            last N
                        </button>
                    </div>
                    {velocityMode === "range" && (
                        <>
                            <input
                                type="date"
                                value={velocityRangeFrom}
                                onChange={(event) => setVelocityRangeFrom(event.target.value)}
                            />
                            <input
                                type="date"
                                value={velocityRangeTo}
                                onChange={(event) => setVelocityRangeTo(event.target.value)}
                            />
                        </>
                    )}
                    {velocityMode === "lastN" && (
                        <input
                            type="number"
                            min={1}
                            value={velocityN}
                            style={{ width: 60 }}
                            onChange={(event) => setVelocityN(Math.max(1, Number(event.target.value) || 1))}
                        />
                    )}
                    <ExportButton onClick={handleExportVelocity} loading={exporting} />
                </div>
            </div>
            <div ref={velocityChartRef}>
                {velocityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={velocityChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis dataKey="sprintName" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" allowDecimals={false} />
                            <Tooltip content={<VelocityTooltip />} />
                            <Legend />
                            <Bar dataKey="completedPoints" name="completed points">
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
                                    formatter={(value: number) => (value > 0 ? `${value} unpointed` : "")}
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
        </>
    );
}
