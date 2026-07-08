import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    BarChart,
    Bar,
    Cell,
    LabelList,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    Legend,
    Label,
} from "recharts";
import type {
    SprintSummary,
    SprintStats,
    ComplexityStats,
    ComplexityTimingPoint,
    StatusBreakdownPoint,
    StatusBreakdownGranularity,
    DayActivityMap,
    StoryStatus, StoryComplexity,
    SubtaskStatus,
    VelocityPoint,
    VelocitySelection,
} from "@shared/types";
import { api } from "../api/client";
import { StatusBreakdownChart } from "../components/stats/StatusBreakdownChart";
import { BurndownChart } from "../components/stats/BurndownChart";
import { AdvancedBurndownChart } from "../components/stats/AdvancedBurndownChart";
import { SprintActivityCalendar } from "../components/calendar/SprintActivityCalendar";
import { ExportButton } from "../components/ExportButton";
import { SUBTASK_STATUSES, STORY_STATUSES, STATUS_LABELS, BURNDOWN_MILESTONES } from "../components/StatusBadge";
import { parseIsoDate, formatIsoDate } from "../utils/calendarGrid";
import { exportSectionsAsPdf, type PdfSection } from "../utils/pdfExport";
import { colorForStory } from "../utils/storyColor";
import { computeBurndownPoints, computeAdvancedBurndownPoints } from "../utils/burndown";
import "./StatsPage.css";

const COMPLEXITY_RATINGS = [1, 2, 3, 4, 5];
const AVERAGE_POINT_COLOR = "#ffffff";

// groups the complexity/running-time points by story
function groupPointsByStory(points: ComplexityTimingPoint[]) {
    const byStory = new Map<number, { storyId: number; storyLabel: string; points: ComplexityTimingPoint[] }>();
    for (const point of points) {
        const existing = byStory.get(point.storyId);
        if (existing) {
            existing.points.push(point);
        } else {
            byStory.set(point.storyId, { storyId: point.storyId, storyLabel: point.storyLabel, points: [point] });
        }
    }
    return Array.from(byStory.values());
}

interface ComplexityAveragePoint {
    complexityRating: number;
    runningTimeDays: number;
    pointCount: number;
    isAverage: true;
}

// calculate the average running time for each rated complexity
function averageRunningTimeByComplexity(points: ComplexityTimingPoint[]): ComplexityAveragePoint[] {
    const totals = new Map<number, { sum: number; count: number }>();
    for (const point of points) {
        const entry = totals.get(point.complexityRating) ?? { sum: 0, count: 0 };
        entry.sum += point.runningTimeDays;
        entry.count += 1;
        totals.set(point.complexityRating, entry);
    }
    return Array.from(totals.entries())
        .map(([complexityRating, { sum, count }]) => ({
            complexityRating,
            runningTimeDays: Math.round((sum / count) * 10) / 10,
            pointCount: count,
            isAverage: true as const,
        }))
        .sort((a, b) => a.complexityRating - b.complexityRating);
}

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

function VelocityTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { payload: VelocityPoint }[];
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

// counts weekdays (mon-fri) in an inclusive date range.
function countWeekdays(start: string, end: string) {
    let count = 0;
    for (
        let cursor = parseIsoDate(start);
        formatIsoDate(cursor) <= end;
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1))
    ) {
        const day = cursor.getUTCDay();
        if (day !== 0 && day !== 6) {
            count += 1;
        }
    }
    return count;
}

function isWeekday(dateString: string) {
    const day = parseIsoDate(dateString).getUTCDay();
    return day !== 0 && day !== 6;
}

// renders one day's status tally as "label: count, label: count", skipping
// zero counts - used to describe a StatusBreakdownPoint in the pdf report.
function describeStatusCounts(counts: Record<string, number>, statusLabels: StoryStatus[]) {
    const parts = statusLabels
        .filter((status) => (counts[status] ?? 0) > 0)
        .map((status) => `${STATUS_LABELS[status]}: ${counts[status]}`);
    return parts.length > 0 ? parts.join(", ") : "no statuses recorded";
}

// renders one day's remaining-until-milestone counts as "label: count, label: count" -
// used to describe an AdvancedBurndownPoint in the pdf report.
function describeMilestones(counts: Record<string, number>, milestones: SubtaskStatus[]) {
    return milestones.map((milestone) => `${STATUS_LABELS[milestone]}: ${counts[milestone] ?? 0}`).join(", ");
}

// "/stats": charts and activity calendar for one selected sprint.
export function StatsPage() {
    const { sprintId: sprintIdParam } = useParams<{ sprintId?: string }>();
    const navigate = useNavigate();
    const selectedSprintId: string = sprintIdParam ?? "";

    const [sprints, setSprints] = useState<SprintSummary[]>([]);
    const [stats, setStats] = useState<SprintStats | null>(null);
    const [complexity, setComplexity] = useState<ComplexityStats | null>(null);
    const [granularity, setGranularity] = useState<StatusBreakdownGranularity>("subtask");
    const [burndownMode, setBurndownMode] = useState<"basic" | "advanced">("basic");
    const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownPoint[]>([]);
    const [dayActivity, setDayActivity] = useState<DayActivityMap>({});
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [exportingKey, setExportingKey] = useState<string | null>(null);
    const [velocityMode, setVelocityMode] = useState<VelocitySelection["mode"]>("lastN");
    const [velocityN, setVelocityN] = useState<number>(5);
    const [velocityRangeFrom, setVelocityRangeFrom] = useState<string>("");
    const [velocityRangeTo, setVelocityRangeTo] = useState<string>("");
    const [velocityPoints, setVelocityPoints] = useState<VelocityPoint[]>([]);
    const [velocitySummary, setVelocitySummary] = useState<VelocityPoint | null>(null);

    const repoChartRef = useRef<HTMLDivElement>(null);
    const timeChartRef = useRef<HTMLDivElement>(null);
    const velocityChartRef = useRef<HTMLDivElement>(null);
    const complexityChartRef = useRef<HTMLDivElement>(null);
    const burndownExportRef = useRef<HTMLDivElement>(null);
    const statusBreakdownRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const selectedSprint: SprintSummary | undefined = sprints.find(
        (sprint) => String(sprint.id) === selectedSprintId
    );
    const sprintEndDate: string | null = selectedSprint
        ? selectedSprint.endDate ?? formatIsoDate(new Date())
        : null;
    // used as the velocity chart's anchor when no specific sprint is selected
    const latestSprintId: number | undefined = sprints[0]?.id;

    useEffect(() => {
        api.listSprints().then(setSprints);
    }, []);

    useEffect(() => {
        if (!selectedSprintId) {
            return;
        }
        api.getSprintStats(Number(selectedSprintId)).then(setStats);
        api.getDayActivity(Number(selectedSprintId)).then(setDayActivity);
        api.getComplexityTiming(Number(selectedSprintId)).then(setComplexity);
    }, [selectedSprintId]);

    useEffect(() => {
        if (!selectedSprintId) {
            return;
        }
        api.getStatusBreakdown(Number(selectedSprintId), granularity).then(setStatusBreakdown);
    }, [selectedSprintId, granularity]);

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

    // only show velocity charts when no specific sprint is selected
    useEffect(() => {
        if (selectedSprintId || !latestSprintId) {
            return;
        }
        const selection: VelocitySelection =
            velocityMode === "range"
                ? { mode: "range", from: velocityRangeFrom, to: velocityRangeTo }
                : velocityMode === "lastN"
                  ? { mode: "lastN", n: velocityN }
                  : { mode: "all" };
        api.getVelocityHistory(latestSprintId, selection).then(setVelocityPoints);
    }, [selectedSprintId, latestSprintId, velocityMode, velocityN, velocityRangeFrom, velocityRangeTo]);

    // this sprint's own completed-points figure, shown as a Summary tile.
    useEffect(() => {
        if (!selectedSprintId) {
            setVelocitySummary(null);
            return;
        }
        api
            .getVelocityHistory(Number(selectedSprintId), { mode: "lastN", n: 1 })
            .then((points) => setVelocitySummary(points[0] ?? null));
    }, [selectedSprintId]);

    useEffect(() => {
        if (!selectedSprint || !sprintEndDate) {
            return;
        }
        api.listHolidays(selectedSprint.startDate, sprintEndDate).then((dates) => setHolidays(new Set(dates)));
    }, [selectedSprint?.startDate, sprintEndDate]);

    async function handleToggleHoliday(date: string) {
        if (holidays.has(date)) {
            await api.removeHoliday(date);
        } else {
            await api.addHoliday(date);
        }
        if (selectedSprint && sprintEndDate) {
            api.listHolidays(selectedSprint.startDate, sprintEndDate).then((dates) => setHolidays(new Set(dates)));
        }
    }

    // builds the written report content for each section
    function buildReportSections() {
        if (!stats || !selectedSprint || !sprintEndDate) {
            return [];
        }

        const statusLabels = granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES;
        const firstBreakdown = statusBreakdown[0];
        const lastBreakdown = statusBreakdown[statusBreakdown.length - 1];
        const firstBurndown = burndownPoints[0];
        const lastBurndown = burndownPoints[burndownPoints.length - 1];
        const firstAdvancedBurndown = advancedBurndownPoints[0];
        const lastAdvancedBurndown = advancedBurndownPoints[advancedBurndownPoints.length - 1];
        const activeDayCount = Object.keys(dayActivity).length;
        const storyDayCounts = stats.storyTimeDays.map((story) => story.days);
        const averageStoryDays =
            storyDayCounts.length > 0 ? storyDayCounts.reduce((a, b) => a + b, 0) / storyDayCounts.length : 0;

        return [
            {
                title: `Summary - ${selectedSprint.name}`,
                lines: [
                    `Sprint: ${selectedSprint.name} (${selectedSprint.startDate} to ${sprintEndDate})`,
                    `Completed: ${isCompleted ? "yes" : "ongoing"}`,
                    `Pull requests: ${stats.prCount}`,
                    `Stories: ${stats.storyCount}`,
                    `Repos touched: ${stats.repoCounts.length}`,
                    `Sprint days (excl. weekends): ${totalWeekdays}`,
                    `Holidays: ${holidayWeekdays}`,
                    `Velocity: ${velocitySummary?.completedPoints ?? 0} pts${
                        velocitySummary && velocitySummary.unpointedDoneStoryCount > 0
                            ? ` (${velocitySummary.unpointedDoneStoryCount} stories unpointed)`
                            : ""
                    }`,
                ],
            },
            {
                title: "Repo distribution",
                element: repoChartRef.current ?? undefined,
                lines:
                    stats.repoCounts.length > 0
                        ? stats.repoCounts.map(
                              (repo) =>
                                  `${repo.repoName}: ${repo.count} PR${repo.count === 1 ? "" : "s"} (${Math.round(repo.proportion * 100)}%)`
                          )
                        : ["No pull requests recorded against a repo yet."],
            },
            {
                title: "Time per story (days)",
                element: timeChartRef.current ?? undefined,
                lines:
                    stats.storyTimeDays.length > 0
                        ? [
                              ...stats.storyTimeDays.map(
                                  (story) => `${story.description}: ${story.days} day${story.days === 1 ? "" : "s"}`
                              ),
                              `Average: ${averageStoryDays.toFixed(1)} days across ${storyDayCounts.length} stor${
                                  storyDayCounts.length === 1 ? "y" : "ies"
                              }`,
                          ]
                        : ["No completed stories with recorded time yet."],
            },
            {
                title: "Complexity",
                element: complexityChartRef.current ?? undefined,
                lines: complexity
                    ? (() => {
                          const complexityAverages = averageRunningTimeByComplexity(complexity.points);
                          let complexitiesByRating: StoryComplexity[];
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
            },
            {
                title: "Burndown",
                element: burndownExportRef.current ?? undefined,
                lines: !firstBurndown
                    ? ["No status history recorded yet."]
                    : firstBurndown.date === lastBurndown.date
                      ? [
                            `${firstBurndown.date}: ${firstBurndown.actual} remaining (ideal ${firstBurndown.ideal})`,
                            `Milestones remaining (${firstAdvancedBurndown.date}): ${describeMilestones(firstAdvancedBurndown.counts, BURNDOWN_MILESTONES)}`,
                        ]
                      : [
                            `Start (${firstBurndown.date}): ${firstBurndown.actual} remaining (ideal ${firstBurndown.ideal})`,
                            `End (${lastBurndown.date}): ${lastBurndown.actual} remaining (ideal ${lastBurndown.ideal})`,
                            `Milestones remaining at start (${firstAdvancedBurndown.date}): ${describeMilestones(firstAdvancedBurndown.counts, BURNDOWN_MILESTONES)}`,
                            `Milestones remaining at end (${lastAdvancedBurndown.date}): ${describeMilestones(lastAdvancedBurndown.counts, BURNDOWN_MILESTONES)}`,
                        ],
            },
            {
                title: `Status breakdown (${granularity === "story" ? "stories" : granularity + "s"})`,
                element: statusBreakdownRef.current ?? undefined,
                lines: !firstBreakdown
                    ? ["No status history recorded yet."]
                    : firstBreakdown.date === lastBreakdown.date
                      ? [`${firstBreakdown.date}: ${describeStatusCounts(firstBreakdown.counts, statusLabels)}`]
                      : [
                            `Start (${firstBreakdown.date}): ${describeStatusCounts(firstBreakdown.counts, statusLabels)}`,
                            `End (${lastBreakdown.date}): ${describeStatusCounts(lastBreakdown.counts, statusLabels)}`,
                        ],
            },
            {
                title: "Calendar",
                element: calendarRef.current ?? undefined,
                lines: [
                    `${totalWeekdays} working days between ${selectedSprint.startDate} and ${sprintEndDate}`,
                    `${holidayWeekdays} of those were holidays`,
                    `${activeDayCount} day${activeDayCount === 1 ? "" : "s"} had subtask activity`,
                ],
            },
        ] as PdfSection[];
    }

    async function handleExportSection(index: number, section: string) {
        const target = buildReportSections()[index];
        if (!target) {
            return;
        }
        setExportingKey(section);
        try {
            await exportSectionsAsPdf([target], `sprint-stats-${section}-${formatIsoDate(new Date())}.pdf`);
        } finally {
            setExportingKey(null);
        }
    }

    async function handleExportAll() {
        setExportingKey("all");
        try {
            await exportSectionsAsPdf(buildReportSections(), `sprint-stats-${formatIsoDate(new Date())}.pdf`);
        } finally {
            setExportingKey(null);
        }
    }

    async function handleExportVelocity() {
        setExportingKey("velocity");
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
                ],
            };
            await exportSectionsAsPdf([section], `velocity-${formatIsoDate(new Date())}.pdf`);
        } finally {
            setExportingKey(null);
        }
    }

    const velocitySelection: VelocitySelection =
        velocityMode === "range"
            ? { mode: "range", from: velocityRangeFrom, to: velocityRangeTo }
            : velocityMode === "lastN"
              ? { mode: "lastN", n: velocityN }
              : { mode: "all" };
    const totalWeekdays = selectedSprint && sprintEndDate ? countWeekdays(selectedSprint.startDate, sprintEndDate) : 0;
    const holidayWeekdays = Array.from(holidays).filter(isWeekday).length;
    const isCompleted = selectedSprint ? selectedSprint.endDate !== null : false;
    const isWorkingDay = (date: string) => isWeekday(date) && !holidays.has(date);
    const burndownPoints = computeBurndownPoints(statusBreakdown, isWorkingDay);
    const advancedBurndownPoints = computeAdvancedBurndownPoints(
        statusBreakdown,
        granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES,
        BURNDOWN_MILESTONES,
        isWorkingDay
    );
    // don't show average points in the graph if there is only one rating (as rating == average)
    const complexityChartAverages = complexity
        ? averageRunningTimeByComplexity(complexity.points).filter((average) => average.pointCount > 1)
        : [];

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to={selectedSprint ? `/sprints/${selectedSprint.id}` : "/"} className="back-link">
                        {selectedSprint ? `back to sprint ${selectedSprint.name}` : "back to sprints"}
                    </Link>
                    <h1>Stats</h1>
                </div>
                <select
                    value={selectedSprintId}
                    onChange={(event) => navigate(event.target.value ? `/stats/${event.target.value}` : "/stats")}
                >
                    <option value="">select a sprint</option>
                    {sprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                            {sprint.name}
                        </option>
                    ))}
                </select>
                {stats && (
                    <ExportButton
                        onClick={handleExportAll}
                        loading={exportingKey === "all"}
                        label="export all as pdf"
                    />
                )}
            </div>

            {!selectedSprintId && latestSprintId && (
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
                            <ExportButton onClick={handleExportVelocity} loading={exportingKey === "velocity"} />
                        </div>
                    </div>
                    <div ref={velocityChartRef}>
                        {velocityPoints.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={velocityPoints}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                    <XAxis dataKey="sprintName" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" allowDecimals={false} />
                                    <Tooltip content={<VelocityTooltip />} />
                                    <Bar dataKey="completedPoints" name="completed points">
                                        {velocityPoints.map((point) => (
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
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="complexity-note">No sprints in this selection yet.</p>
                        )}
                    </div>
                </>
            )}

            {stats && selectedSprint && sprintEndDate && (
                <>
                    <div className="page-header">
                        <h2>Summary</h2>
                        <ExportButton
                            onClick={() => handleExportSection(0, "summary")}
                            loading={exportingKey === "summary"}
                        />
                    </div>
                    <div className="stats-summary">
                        <div className="stat-tile">
                            <span className="stat-value">{stats.prCount}</span>
                            <span className="stat-label">pull requests</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{stats.storyCount}</span>
                            <span className="stat-label">stories</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{velocitySummary?.completedPoints ?? 0}</span>
                            <span className="stat-label">velocity (pts)</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{stats.repoCounts.length}</span>
                            <span className="stat-label">repos touched</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{totalWeekdays}</span>
                            <span className="stat-label">sprint days (excl. weekends)</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{holidayWeekdays}</span>
                            <span className="stat-label">holidays</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{selectedSprint.startDate}</span>
                            <span className="stat-label">start date</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{selectedSprint.endDate ?? "ongoing"}</span>
                            <span className="stat-label">end date</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-value">{isCompleted ? "yes" : "ongoing"}</span>
                            <span className="stat-label">completed</span>
                        </div>
                    </div>

                    <div className="page-header">
                        <h2>Repo distribution</h2>
                        <ExportButton
                            onClick={() => handleExportSection(1, "repo-distribution")}
                            loading={exportingKey === "repo-distribution"}
                        />
                    </div>
                    <div ref={repoChartRef}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={stats.repoCounts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                                <YAxis type="category" dataKey="repoName" stroke="#9ca3af" width={180} />
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                                <Bar dataKey="count" fill="#d97706" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="page-header">
                        <h2>Time per story (days)</h2>
                        <ExportButton
                            onClick={() => handleExportSection(2, "time-per-story")}
                            loading={exportingKey === "time-per-story"}
                        />
                    </div>
                    <div ref={timeChartRef}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={stats.storyTimeDays} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis type="category" dataKey="storyLabel" stroke="#9ca3af" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.description ?? ""}
                                />
                                <Bar dataKey="days" fill="#2563eb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="page-header">
                        <h2>Complexity</h2>
                        <ExportButton
                            onClick={() => handleExportSection(3, "complexity")}
                            loading={exportingKey === "complexity"}
                        />
                    </div>
                    <div ref={complexityChartRef}>
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

                    <div className="page-header">
                        <h2>Burndown</h2>
                        <div className="page-header-actions">
                            <div className="granularity-toggle">
                                <button
                                    className={burndownMode === "basic" ? "active" : ""}
                                    onClick={() => setBurndownMode("basic")}
                                >
                                    basic
                                </button>
                                <button
                                    className={burndownMode === "advanced" ? "active" : ""}
                                    onClick={() => setBurndownMode("advanced")}
                                >
                                    advanced
                                </button>
                            </div>
                            <div className="granularity-toggle">
                                <button
                                    className={granularity === "subtask" ? "active" : ""}
                                    onClick={() => setGranularity("subtask")}
                                >
                                    subtasks
                                </button>
                                <button
                                    className={granularity === "story" ? "active" : ""}
                                    onClick={() => setGranularity("story")}
                                >
                                    stories
                                </button>
                            </div>
                            <ExportButton
                                onClick={() => handleExportSection(4, "burndown")}
                                loading={exportingKey === "burndown"}
                            />
                        </div>
                    </div>
                    <div data-testid="burndown-chart-visible">
                        {burndownMode === "basic" ? (
                            <BurndownChart points={burndownPoints} />
                        ) : (
                            <AdvancedBurndownChart points={advancedBurndownPoints} milestones={BURNDOWN_MILESTONES} />
                        )}
                    </div>
                    {/* always-mounted off-screen: the pdf export shows both charts side by side,
                        independent of which one the basic/advanced toggle currently shows on screen */}
                    <div
                        data-testid="burndown-chart-export"
                        style={{ position: "fixed", top: 0, left: -10000, width: 1000, pointerEvents: "none" }}
                    >
                        <div ref={burndownExportRef} style={{ display: "flex", gap: 20 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>Basic</div>
                                <BurndownChart points={burndownPoints} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>Advanced</div>
                                <AdvancedBurndownChart points={advancedBurndownPoints} milestones={BURNDOWN_MILESTONES} />
                            </div>
                        </div>
                    </div>

                    <div className="page-header">
                        <h2>Status breakdown</h2>
                        <ExportButton
                            onClick={() => handleExportSection(5, "status-breakdown")}
                            loading={exportingKey === "status-breakdown"}
                        />
                    </div>
                    <div ref={statusBreakdownRef}>
                        <StatusBreakdownChart
                            points={statusBreakdown}
                            statuses={granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES}
                        />
                    </div>

                    <div className="page-header">
                        <h2>Calendar</h2>
                        <ExportButton
                            onClick={() => handleExportSection(6, "calendar")}
                            loading={exportingKey === "calendar"}
                        />
                    </div>
                    <div ref={calendarRef}>
                        <SprintActivityCalendar
                            startDate={selectedSprint.startDate}
                            endDate={sprintEndDate}
                            holidays={holidays}
                            dayActivity={dayActivity}
                            onToggleHoliday={handleToggleHoliday}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
