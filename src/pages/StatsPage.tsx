import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { SprintSummary, SprintStats } from "@shared/types";
import { api } from "../api/client";
import { VelocitySection } from "../components/stats/VelocitySection";
import { SummarySection, type SummarySectionHandle } from "../components/stats/SummarySection";
import { RepoDistributionSection } from "../components/stats/RepoDistributionSection";
import { TimePerStorySection } from "../components/stats/TimePerStorySection";
import { ComplexitySection, type ComplexitySectionHandle } from "../components/stats/ComplexitySection";
import { StatusHistorySection, type StatusHistorySectionHandle } from "../components/stats/StatusHistorySection";
import { CalendarSection, type CalendarSectionHandle } from "../components/stats/CalendarSection";
import { ExportButton } from "../components/ExportButton";
import { parseIsoDate, formatIsoDate } from "../utils/calendarGrid";
import { exportSectionsAsPdf, type PdfSection } from "../utils/pdfExport";
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

// "/stats": charts and activity calendar for one selected sprint.
export function StatsPage() {
    const { sprintId: sprintIdParam } = useParams<{ sprintId?: string }>();
    const navigate = useNavigate();
    const selectedSprintId: string = sprintIdParam ?? "";

    const [sprints, setSprints] = useState<SprintSummary[]>([]);
    const [stats, setStats] = useState<SprintStats | null>(null);
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [exportingAll, setExportingAll] = useState(false);

    const repoChartRef = useRef<HTMLDivElement>(null);
    const timeChartRef = useRef<HTMLDivElement>(null);
    const summaryRef = useRef<SummarySectionHandle>(null);
    const complexityRef = useRef<ComplexitySectionHandle>(null);
    const statusHistoryRef = useRef<StatusHistorySectionHandle>(null);
    const calendarRef = useRef<CalendarSectionHandle>(null);

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
    }, [selectedSprintId]);

    useEffect(() => {
        if (!selectedSprint || !sprintEndDate) {
            return;
        }
        api.listHolidays(selectedSprint.startDate, sprintEndDate).then((dates) => setHolidays(new Set(dates)));
    }, [selectedSprint?.startDate, sprintEndDate]);

    // builds the written report content for each section.
    // most sections build their own text and stuff; only the sections whose
    // data (stats) is shared with siblings are still built here directly.
    function buildReportSections() {
        if (!stats || !selectedSprint || !sprintEndDate) {
            return [];
        }

        const summarySection = summaryRef.current?.getReportSection() ?? { title: "Summary", lines: [] };
        const complexitySection = complexityRef.current?.getReportSection() ?? { title: "Complexity", lines: [] };
        const [burndownSection, statusBreakdownSection] = statusHistoryRef.current?.getReportSections() ?? [
            { title: "Burndown", lines: [] },
            { title: "Status breakdown", lines: [] },
        ];
        const calendarSection = calendarRef.current?.getReportSection() ?? { title: "Calendar", lines: [] };

        const storyDayCounts = stats.storyTimeDays.map((story) => story.days);
        const averageStoryDays =
            storyDayCounts.length > 0 ? storyDayCounts.reduce((a, b) => a + b, 0) / storyDayCounts.length : 0;

        return [
            summarySection,
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
            complexitySection,
            burndownSection,
            statusBreakdownSection,
            calendarSection,
        ] as PdfSection[];
    }

    async function handleExportSection(index: number, section: string) {
        const target = buildReportSections()[index];
        if (!target) {
            return;
        }
        await exportSectionsAsPdf([target], `sprint-stats-${section}-${formatIsoDate(new Date())}.pdf`);
    }

    async function handleExportAll() {
        setExportingAll(true);
        try {
            await exportSectionsAsPdf(buildReportSections(), `sprint-stats-${formatIsoDate(new Date())}.pdf`);
        } finally {
            setExportingAll(false);
        }
    }

    const totalWeekdays = selectedSprint && sprintEndDate ? countWeekdays(selectedSprint.startDate, sprintEndDate) : 0;
    const holidayWeekdays = Array.from(holidays).filter(isWeekday).length;
    const isCompleted = selectedSprint ? selectedSprint.endDate !== null : false;
    const isWorkingDay = (date: string) => isWeekday(date) && !holidays.has(date);

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
                        loading={exportingAll}
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
                        ref={summaryRef}
                        sprintId={Number(selectedSprintId)}
                        stats={stats}
                        selectedSprint={selectedSprint}
                        sprintEndDate={sprintEndDate}
                        totalWeekdays={totalWeekdays}
                        holidayWeekdays={holidayWeekdays}
                        isCompleted={isCompleted}
                        onExport={() => handleExportSection(0, "summary")}
                    />

                    <RepoDistributionSection
                        ref={repoChartRef}
                        repoCounts={stats.repoCounts}
                        onExport={() => handleExportSection(1, "repo-distribution")}
                    />

                    <TimePerStorySection
                        ref={timeChartRef}
                        storyTimeDays={stats.storyTimeDays}
                        onExport={() => handleExportSection(2, "time-per-story")}
                    />

                    <ComplexitySection
                        ref={complexityRef}
                        sprintId={Number(selectedSprintId)}
                        onExport={() => handleExportSection(3, "complexity")}
                    />

                    <StatusHistorySection
                        ref={statusHistoryRef}
                        sprintId={Number(selectedSprintId)}
                        isWorkingDay={isWorkingDay}
                        onExportBurndown={() => handleExportSection(4, "burndown")}
                        onExportStatusBreakdown={() => handleExportSection(5, "status-breakdown")}
                    />

                    <CalendarSection
                        ref={calendarRef}
                        sprintId={Number(selectedSprintId)}
                        startDate={selectedSprint.startDate}
                        endDate={sprintEndDate}
                        holidays={holidays}
                        onHolidaysChange={setHolidays}
                        totalWeekdays={totalWeekdays}
                        holidayWeekdays={holidayWeekdays}
                        onExport={() => handleExportSection(6, "calendar")}
                    />
                </>
            )}
        </div>
    );
}
