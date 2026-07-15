import React from "react";
import { Link } from "react-router-dom";
import type { CalendarEntry } from "@shared/types";
import {
    buildMonthGridDates,
    formatDisplayDate,
    formatIsoDate,
    isSameUtcMonth,
    monthsBetween,
} from "../../utils/calendarGrid";
import "./calendar.css";
import "./SprintRangeCalendar.css";

interface SprintRangeCalendarProps {
    entries: CalendarEntry[];
}

const DAY_HEADERS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// each day is split into two grid tracks so a bar can start/end half-way
// through a day - used when one sprint ends the same day the next begins.
const COLUMNS_PER_DAY = 2;

const SPRINT_COLORS: string[] = [
    "#3987e5",
    "#d95926",
    "#9085e9",
    "#199e70",
    "#d55181",
    "#c98500",
];

interface SprintBar {
    entry: CalendarEntry;
    start: string;
    end: string;
    color: string;
    lane: number;
}

// each sprint takes the first lane whose last sprint ends ON or BEFORE this one starts.
// a shared start/end day causes the day to be shared half/half between sprints.
// an actual overlap creates multiple lanes, where a sprint's lane is persisted
// across weeks.
function assignLanes(entries: CalendarEntry[], today: string) {
    const sorted: CalendarEntry[] = [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const laneEnds: string[] = [];
    return sorted.map((entry, index) => {
        const start = entry.startDate;
        const end = entry.endDate ?? today;
        let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(end);
        } else {
            laneEnds[lane] = end;
        }
        return { entry, start, end, color: SPRINT_COLORS[index % SPRINT_COLORS.length], lane } as SprintBar;
    });
}

// given a bar, determine its span in the calendar.
// returned columns are both [0, 6].
function weekSpan(bar: SprintBar, weekDates: Date[]) {
    const weekStart: string = formatIsoDate(weekDates[0]);
    const weekEnd: string = formatIsoDate(weekDates[6]);
    if (bar.end < weekStart || bar.start > weekEnd) {
        return null;
    }
    let startCol = 0;
    while (startCol < 7 && formatIsoDate(weekDates[startCol]) < bar.start) {
        startCol++;
    }
    let endCol = 6;
    while (endCol >= 0 && formatIsoDate(weekDates[endCol]) > bar.end) {
        endCol--;
    }
    return startCol > endCol ? null : { startCol, endCol };
}

function barTitle(entry: CalendarEntry) {
    const range = `${formatDisplayDate(entry.startDate)} to ${entry.endDate ? formatDisplayDate(entry.endDate) : "present"}`;
    return entry.repos.length > 0 ? `${entry.sprintName}: ${range} — ${entry.repos.join(", ")}` : `${entry.sprintName}: ${range}`;
}

// display a calendar with each sprint shows as a range bar
export function SprintRangeCalendar({ entries }: SprintRangeCalendarProps) {
    if (entries.length === 0) {
        return <p className="activity-calendar-empty">no sprints match this filter.</p>;
    }

    const today = formatIsoDate(new Date());
    const rangeStart = entries.reduce((min, entry) => (entry.startDate < min ? entry.startDate : min), entries[0].startDate);
    const rangeEnd = entries.reduce((max, entry) => {
        const end = entry.endDate ?? today;
        return end > max ? end : max;
    }, entries[0].endDate ?? today);

    const bars = assignLanes(entries, today);
    const laneCount = bars.reduce((max, bar) => Math.max(max, bar.lane + 1), 1);
    const months = monthsBetween(rangeStart, rangeEnd);

    // used to determine if two sprints should half/half share a day if their start/ends colids
    function hasSharedStart(bar: SprintBar): boolean {
        return bars.some((other) => other !== bar && other.end === bar.start);
    }
    function hasSharedEnd(bar: SprintBar): boolean {
        return bars.some((other) => other !== bar && other.start === bar.end);
    }

    return (
        <div className="sprint-calendar range-calendar">
            {months.map(({ year, month }) => {
                const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                });
                const weeks = buildMonthGridDates(year, month);

                return (
                    <div key={`${year}-${month}`} className="calendar-month">
                        <h3 className="calendar-month-title">{monthLabel}</h3>
                        <div className="range-week-header">
                            {DAY_HEADERS.map((label) => (
                                <div key={label} className="calendar-day-header">
                                    {label}
                                </div>
                            ))}
                        </div>
                        {weeks.map((weekDates, weekIndex) => (
                            <div key={weekIndex} className="range-week">
                                <div className="range-daynumbers">
                                    {weekDates.map((date) => (
                                        <span
                                            key={formatIsoDate(date)}
                                            className={
                                                isSameUtcMonth(date, year, month)
                                                    ? "range-day-number"
                                                    : "range-day-number range-day-number-muted"
                                            }
                                        >
                                            {date.getUTCDate()}
                                        </span>
                                    ))}
                                </div>
                                {Array.from({ length: laneCount }).map((_, lane) => {
                                    const laneBars: SprintBar[] = bars.filter((bar) => bar.lane === lane);
                                    return (
                                        <div key={lane} className="range-lane">
                                            {laneBars.map((bar) => {
                                                const span = weekSpan(bar, weekDates);
                                                if (!span) {
                                                    return null;
                                                }
                                                const isTrueStart = formatIsoDate(weekDates[span.startCol]) === bar.start;
                                                const isTrueEnd = formatIsoDate(weekDates[span.endCol]) === bar.end;
                                                const colStart = span.startCol * COLUMNS_PER_DAY + (isTrueStart && hasSharedStart(bar) ? 2 : 1);
                                                const colEnd = span.endCol * COLUMNS_PER_DAY + (isTrueEnd && hasSharedEnd(bar) ? 2 : COLUMNS_PER_DAY + 1);
                                                return (
                                                    <Link
                                                        key={bar.entry.sprintId}
                                                        to={`/sprints/${bar.entry.sprintId}`}
                                                        className="range-bar"
                                                        style={{
                                                            gridColumn: `${colStart} / ${colEnd}`,
                                                            backgroundColor: bar.color,
                                                        }}
                                                        title={barTitle(bar.entry)}
                                                    >
                                                        {span.startCol === 0 || isTrueStart ? bar.entry.sprintName : ""}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
