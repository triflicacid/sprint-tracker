import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
    SprintSummary,
    SprintStats,
    ComplexityStats,
    StatusBreakdownPoint,
    StatusBreakdownGranularity,
    DayActivityMap,
    StoryStatus,
    SubtaskStatus,
    VelocityPoint,
} from "@shared/types";
import { api } from "../api/client";
import { VelocitySection } from "../components/stats/VelocitySection";
import { SummarySection } from "../components/stats/SummarySection";
import { RepoDistributionSection } from "../components/stats/RepoDistributionSection";
import { TimePerStorySection } from "../components/stats/TimePerStorySection";
import { ComplexitySection } from "../components/stats/ComplexitySection";
import { BurndownSection } from "../components/stats/BurndownSection";
import { StatusBreakdownSection } from "../components/stats/StatusBreakdownSection";
import { CalendarSection } from "../components/stats/CalendarSection";
import { ExportButton } from "../components/ExportButton";
import { SUBTASK_STATUSES, STORY_STATUSES, STATUS_LABELS, BURNDOWN_MILESTONES } from "../components/StatusBadge";
import { parseIsoDate, formatIsoDate } from "../utils/calendarGrid";
import { exportSectionsAsPdf, type PdfSection } from "../utils/pdfExport";
import { averageRunningTimeByComplexity, COMPLEXITY_RATINGS, type ComplexityAveragePoint } from "../utils/complexityStats";
import { computeBurndownPoints, computeAdvancedBurndownPoints } from "../utils/burndown";
import "./StatsPage.css";

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
    const [velocitySummary, setVelocitySummary] = useState<VelocityPoint | null>(null);

    const repoChartRef = useRef<HTMLDivElement>(null);
    const timeChartRef = useRef<HTMLDivElement>(null);
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
                <VelocitySection sprints={sprints} latestSprintId={latestSprintId} />
            )}

            {stats && selectedSprint && sprintEndDate && (
                <>
                    <SummarySection
                        stats={stats}
                        velocitySummary={velocitySummary}
                        totalWeekdays={totalWeekdays}
                        holidayWeekdays={holidayWeekdays}
                        selectedSprint={selectedSprint}
                        isCompleted={isCompleted}
                        onExport={() => handleExportSection(0, "summary")}
                        loading={exportingKey === "summary"}
                    />

                    <RepoDistributionSection
                        ref={repoChartRef}
                        repoCounts={stats.repoCounts}
                        onExport={() => handleExportSection(1, "repo-distribution")}
                        loading={exportingKey === "repo-distribution"}
                    />

                    <TimePerStorySection
                        ref={timeChartRef}
                        storyTimeDays={stats.storyTimeDays}
                        onExport={() => handleExportSection(2, "time-per-story")}
                        loading={exportingKey === "time-per-story"}
                    />

                    <ComplexitySection
                        ref={complexityChartRef}
                        complexity={complexity}
                        onExport={() => handleExportSection(3, "complexity")}
                        loading={exportingKey === "complexity"}
                    />

                    <BurndownSection
                        ref={burndownExportRef}
                        burndownMode={burndownMode}
                        setBurndownMode={setBurndownMode}
                        granularity={granularity}
                        setGranularity={setGranularity}
                        burndownPoints={burndownPoints}
                        advancedBurndownPoints={advancedBurndownPoints}
                        onExport={() => handleExportSection(4, "burndown")}
                        loading={exportingKey === "burndown"}
                    />

                    <StatusBreakdownSection
                        ref={statusBreakdownRef}
                        points={statusBreakdown}
                        granularity={granularity}
                        onExport={() => handleExportSection(5, "status-breakdown")}
                        loading={exportingKey === "status-breakdown"}
                    />

                    <CalendarSection
                        ref={calendarRef}
                        startDate={selectedSprint.startDate}
                        endDate={sprintEndDate}
                        holidays={holidays}
                        dayActivity={dayActivity}
                        onToggleHoliday={handleToggleHoliday}
                        onExport={() => handleExportSection(6, "calendar")}
                        loading={exportingKey === "calendar"}
                    />
                </>
            )}
        </div>
    );
}
