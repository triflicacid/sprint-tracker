import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type {
    SprintSummary,
    SprintStats,
    StatusBreakdownPoint,
    StatusBreakdownGranularity,
    DayActivityMap,
    StoryStatus,
} from "@shared/types";
import { api } from "../api/client";
import { StatusBreakdownChart } from "../components/stats/StatusBreakdownChart";
import { SprintActivityCalendar } from "../components/calendar/SprintActivityCalendar";
import { SUBTASK_STATUSES, STORY_STATUSES, STATUS_LABELS } from "../components/StatusBadge";
import { parseIsoDate, formatIsoDate } from "../utils/calendarGrid";
import { exportSectionsAsPdf, type PdfSection } from "../utils/pdfExport";

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

// "/stats": charts and activity calendar for one selected sprint.
export function StatsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSprintId: string | null = searchParams.get("sprintId");

    const [sprints, setSprints] = useState<SprintSummary[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>(initialSprintId ?? "");
    const [stats, setStats] = useState<SprintStats | null>(null);
    const [granularity, setGranularity] = useState<StatusBreakdownGranularity>("subtask");
    const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownPoint[]>([]);
    const [dayActivity, setDayActivity] = useState<DayActivityMap>({});
    const [holidays, setHolidays] = useState<Set<string>>(new Set());

    const repoChartRef = useRef<HTMLDivElement>(null);
    const timeChartRef = useRef<HTMLDivElement>(null);
    const statusBreakdownRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const selectedSprint: SprintSummary | undefined = sprints.find(
        (sprint) => String(sprint.id) === selectedSprintId
    );
    const sprintEndDate: string | null = selectedSprint
        ? selectedSprint.endDate ?? formatIsoDate(new Date())
        : null;

    useEffect(() => {
        api.listSprints().then(setSprints);
    }, []);

    useEffect(() => {
        if (!selectedSprintId) {
            return;
        }
        setSearchParams({ sprintId: selectedSprintId });
        api.getSprintStats(Number(selectedSprintId)).then(setStats);
        api.getDayActivity(Number(selectedSprintId)).then(setDayActivity);
    }, [selectedSprintId]);

    useEffect(() => {
        if (!selectedSprintId) {
            return;
        }
        api.getStatusBreakdown(Number(selectedSprintId), granularity).then(setStatusBreakdown);
    }, [selectedSprintId, granularity]);

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
        const activeDayCount = Object.keys(dayActivity).length;
        const storyDayCounts = stats.storyTimeDays.map((story) => story.days);
        const averageStoryDays =
            storyDayCounts.length > 0 ? storyDayCounts.reduce((a, b) => a + b, 0) / storyDayCounts.length : 0;

        return [
            {
                title: `Summary - ${selectedSprint.name}`,
                lines: [
                    `Sprint: ${selectedSprint.name} (${selectedSprint.startDate} to ${sprintEndDate})`,
                    `Pull requests: ${stats.prCount}`,
                    `Stories: ${stats.storyCount}`,
                    `Repos touched: ${stats.repoCounts.length}`,
                    `Sprint days (excl. weekends): ${totalWeekdays}`,
                    `Holidays: ${holidayWeekdays}`,
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

    function handleExportSection(index: number, section: string) {
        const target = buildReportSections()[index];
        if (target) {
            exportSectionsAsPdf([target], `sprint-stats-${section}-${formatIsoDate(new Date())}.pdf`);
        }
    }

    function handleExportAll() {
        exportSectionsAsPdf(buildReportSections(), `sprint-stats-${formatIsoDate(new Date())}.pdf`);
    }

    const totalWeekdays = selectedSprint && sprintEndDate ? countWeekdays(selectedSprint.startDate, sprintEndDate) : 0;
    const holidayWeekdays = Array.from(holidays).filter(isWeekday).length;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to={selectedSprint ? `/sprints/${selectedSprint.id}` : "/"} className="back-link">
                        {selectedSprint ? `back to sprint ${selectedSprint.name}` : "back to sprints"}
                    </Link>
                    <h1>Stats</h1>
                </div>
                <select value={selectedSprintId} onChange={(event) => setSelectedSprintId(event.target.value)}>
                    <option value="">select a sprint</option>
                    {sprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                            {sprint.name}
                        </option>
                    ))}
                </select>
                {stats && (
                    <button onClick={handleExportAll}>export all as pdf</button>
                )}
            </div>

            {stats && selectedSprint && sprintEndDate && (
                <>
                    <div className="page-header">
                        <h2>Summary</h2>
                        <button onClick={() => handleExportSection(0, "summary")}>export pdf</button>
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
                    </div>

                    <div className="page-header">
                        <h2>Repo distribution</h2>
                        <button onClick={() => handleExportSection(1, "repo-distribution")}>
                            export pdf
                        </button>
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
                        <button onClick={() => handleExportSection(2, "time-per-story")}>
                            export pdf
                        </button>
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
                        <h2>Status breakdown</h2>
                        <div className="page-header-actions">
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
                            <button onClick={() => handleExportSection(3, "status-breakdown")}>
                                export pdf
                            </button>
                        </div>
                    </div>
                    <div ref={statusBreakdownRef}>
                        <StatusBreakdownChart
                            points={statusBreakdown}
                            statuses={granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES}
                        />
                    </div>

                    <div className="page-header">
                        <h2>Calendar</h2>
                        <button onClick={() => handleExportSection(4, "calendar")}>export pdf</button>
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
