import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Label,
} from "recharts";
import type { ComplexityStats, ComplexityTimingPoint } from "@shared/types";
import { api } from "#api/client";
import { ExportButton } from "../../ExportButton";
import { CollapsibleSection } from "../../CollapsibleSection";
import { colorForStory } from "#utils/storyColor";
import {
    COMPLEXITY_RATINGS,
    averageRunningTimeByComplexity,
    groupPointsByStory,
    type ComplexityAveragePoint,
} from "#utils/complexityStats";
import type { PdfSection } from "#utils/pdfExport";
import "../statsShared.css";

const AVERAGE_POINT_COLOR = "#ffffff";

// custom scatter tooltip - handles both a per-subtask point and an average marker.
function ComplexityTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { payload: ComplexityTimingPoint | ComplexityAveragePoint }[];
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }
    const point = payload[0].payload;
    if ("isAverage" in point) {
        return (
            <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", padding: "6px 10px" }}>
                <div>average for complexity {point.complexityRating}</div>
                <div>running time: {point.runningTimeDays} day{point.runningTimeDays === 1 ? "" : "s"}</div>
            </div>
        );
    }
    return (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", padding: "6px 10px" }}>
            <div>
                {point.storyLabel} - subtask #{point.subtaskId}
            </div>
            <div>complexity: {point.complexityRating}</div>
            <div>running time: {point.runningTimeDays} day{point.runningTimeDays === 1 ? "" : "s"}</div>
        </div>
    );
}

export interface ComplexitySectionHandle {
    getReportSection(): PdfSection;
}

interface ComplexitySectionProps {
    sprintId: number;
    onExport: () => Promise<void>;
}

// per-rating tally, per-story total complexity, and complexity-vs-running-time
export const ComplexitySection = forwardRef<ComplexitySectionHandle, ComplexitySectionProps>(
    function ComplexitySection({ sprintId, onExport }, ref) {
        const [complexity, setComplexity] = useState<ComplexityStats | null>(null);
        const [loading, setLoading] = useState(false);
        const chartRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            api.getComplexityTiming(sprintId).then(setComplexity);
        }, [sprintId]);

        async function handleExport() {
            setLoading(true);
            try {
                await onExport();
            } finally {
                setLoading(false);
            }
        }

        useImperativeHandle(ref, () => ({
            getReportSection() {
                return {
                    title: "Complexity",
                    element: chartRef.current ?? undefined,
                    lines: complexity
                        ? (() => {
                              const complexityAverages = averageRunningTimeByComplexity(complexity.points);
                              let complexitiesByRating: typeof complexity.storyComplexity;
                              let averageRunningTime: ComplexityAveragePoint | undefined;
                              return [
                                  ...COMPLEXITY_RATINGS.map(
                                      (rating) => `Complexity ${rating}: ${complexity.ratingCounts[rating] ?? 0} subtask${(complexity.ratingCounts[rating] ?? 0) === 1 ? "" : "s"}`
                                        + ((complexitiesByRating = complexity.storyComplexity.filter((story) => story.totalComplexity === rating)).length > 0
                                              ? ` (${complexitiesByRating
                                                  .map((story) => story.storyLabel)
                                                  .join(', ')})`
                                              : '')
                                        + ((averageRunningTime = complexityAverages.find((average) => average.complexityRating === rating))
                                              ? `, with an average running time of ${averageRunningTime.runningTimeDays} day${averageRunningTime.runningTimeDays === 1 ? '' : 's'}`
                                              : '')
                                  ),
                                  `Unrated/not done: ${complexity.unratedCount + complexity.inProgressRatedCount}`,
                              ];
                          })()
                        : [],
                };
            },
        }));

        // don't show average points in the graph if there is only one rating (as rating == average)
        const complexityChartAverages = complexity
            ? averageRunningTimeByComplexity(complexity.points).filter((average) => average.pointCount > 1)
            : [];

        return (
            <CollapsibleSection title="Complexity" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
                <div ref={chartRef}>
                    <div className="stats-summary">
                        {COMPLEXITY_RATINGS.map((rating) => (
                            <div className="stat-tile" key={rating}>
                                <span className="stat-value">{complexity?.ratingCounts[rating] ?? 0}</span>
                                <span className="stat-label">complexity {rating}</span>
                            </div>
                        ))}
                        <div className="stat-tile">
                            <span className="stat-value">{complexity?.unratedCount ?? 0}</span>
                            <span className="stat-label">unrated</span>
                        </div>
                    </div>

                    {complexity && complexity.storyComplexity.length > 0 && (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={complexity.storyComplexity} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                                <YAxis type="category" dataKey="storyLabel" stroke="#9ca3af" width={100} />
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                                <Bar dataKey="totalComplexity" name="total complexity" fill="#7c3aed" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {complexity && complexity.points.length > 0 ? (
                        <ResponsiveContainer width="100%" height={380}>
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 50, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis
                                    type="number"
                                    dataKey="complexityRating"
                                    name="complexity"
                                    domain={[Math.min(...COMPLEXITY_RATINGS), Math.max(...COMPLEXITY_RATINGS)]}
                                    ticks={COMPLEXITY_RATINGS}
                                    stroke="#9ca3af"
                                >
                                    <Label value="complexity rating" position="bottom" fill="#9ca3af" />
                                </XAxis>
                                <YAxis type="number" dataKey="runningTimeDays" name="running time (days)" stroke="#9ca3af">
                                    <Label
                                        value="running time (days)"
                                        angle={-90}
                                        position="insideLeft"
                                        style={{ textAnchor: "middle" }}
                                        fill="#9ca3af"
                                    />
                                </YAxis>
                                <Tooltip content={<ComplexityTooltip />} />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 30 }} />
                                {groupPointsByStory(complexity.points).map((story) => (
                                    <Scatter
                                        key={story.storyId}
                                        name={story.storyLabel}
                                        data={story.points}
                                        fill={colorForStory(story.storyId)}
                                    />
                                ))}
                                {complexityChartAverages.length > 0 && (
                                    <Scatter
                                        name="average"
                                        data={complexityChartAverages}
                                        shape="square"
                                        fill={AVERAGE_POINT_COLOR}
                                    />
                                )}
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="complexity-note">
                            No done, rated subtasks yet to chart complexity against running time.
                        </p>
                    )}

                    {complexity && averageRunningTimeByComplexity(complexity.points).length > 0 && (
                        <p className="complexity-note">
                            Average running time by complexity (ratings with more than one point are also shown as a
                            square on the chart above):{" "}
                            {averageRunningTimeByComplexity(complexity.points)
                                .map(
                                    (average) =>
                                        `${average.complexityRating}: ${average.runningTimeDays} day${average.runningTimeDays === 1 ? "" : "s"}`
                                )
                                .join(", ")}
                        </p>
                    )}

                    <p className="complexity-note">
                        {complexity?.unratedCount ?? 0} subtask{(complexity?.unratedCount ?? 0) === 1 ? "" : "s"} not yet
                        rated and {complexity?.inProgressRatedCount ?? 0} rated but still in progress are excluded from
                        the chart above.
                    </p>
                </div>
            </CollapsibleSection>
        );
    }
);
