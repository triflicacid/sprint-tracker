import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type {
    SprintSummary,
    SprintStats,
    StatusBreakdownPoint,
    StatusBreakdownGranularity,
    DayActivityMap,
} from "@shared/types";
import { api } from "../api/client";
import { StatusBreakdownChart } from "../components/stats/StatusBreakdownChart";
import { SprintActivityCalendar } from "../components/calendar/SprintActivityCalendar";
import { SUBTASK_STATUSES, STORY_STATUSES } from "../components/StatusBadge";
import { parseIsoDate, formatIsoDate } from "../utils/calendarGrid";

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

    const totalWeekdays: number =
        selectedSprint && sprintEndDate ? countWeekdays(selectedSprint.startDate, sprintEndDate) : 0;
    const holidayWeekdays: number = Array.from(holidays).filter(isWeekday).length;

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
            </div>

            {stats && selectedSprint && sprintEndDate && (
                <>
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

                    <h2>Repo distribution</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.repoCounts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                            <YAxis type="category" dataKey="repoName" stroke="#9ca3af" width={180} />
                            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                            <Bar dataKey="count" fill="#d97706" />
                        </BarChart>
                    </ResponsiveContainer>

                    <h2>Time per story (days)</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.storyTimeDays} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis type="number" stroke="#9ca3af" />
                            <YAxis type="category" dataKey="description" stroke="#9ca3af" width={220} />
                            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                            <Bar dataKey="days" fill="#2563eb" />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="page-header">
                        <h2>Status breakdown</h2>
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
                    </div>
                    <StatusBreakdownChart
                        points={statusBreakdown}
                        statuses={granularity === "subtask" ? SUBTASK_STATUSES : STORY_STATUSES}
                    />

                    <h2>Calendar</h2>
                    <SprintActivityCalendar
                        startDate={selectedSprint.startDate}
                        endDate={sprintEndDate}
                        holidays={holidays}
                        dayActivity={dayActivity}
                        onToggleHoliday={handleToggleHoliday}
                    />
                </>
            )}
        </div>
    );
}
