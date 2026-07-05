import React from "react";
import type { DayActivityMap, DayActivityEntry } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";
import { formatIsoDate, buildMonthGrid, monthsBetween } from "../../utils/calendarGrid";

interface SprintActivityCalendarProps {
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    dayActivity: DayActivityMap;
    onToggleHoliday: (date: string) => void;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_CHIPS = 4;

function activityTitle(entry: DayActivityEntry) {
    const base = `${entry.storyLabel} ${entry.branchName} - ${STATUS_LABELS[entry.status] ?? entry.status}`;
    return entry.prUrl ? `${base} (click to open PR)` : base;
}

// one sprint's day-by-day activity + holiday toggle
export function SprintActivityCalendar({
    startDate,
    endDate,
    holidays,
    dayActivity,
    onToggleHoliday,
}: SprintActivityCalendarProps) {
    const months = monthsBetween(startDate, endDate);

    return (
        <div className="sprint-calendar">
            {months.map(({ year, month }) => {
                const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                });
                const weeks = buildMonthGrid(year, month);

                return (
                    <div key={`${year}-${month}`} className="calendar-month">
                        <h3 className="calendar-month-title">{monthLabel}</h3>
                        <div className="calendar-grid">
                            {DAY_HEADERS.map((label) => (
                                <div key={label} className="calendar-day-header">
                                    {label}
                                </div>
                            ))}
                            {weeks.map((week, weekIndex) =>
                                week.map((date, dayIndex) => {
                                    if (!date) {
                                        return (
                                            <div
                                                key={`${weekIndex}-${dayIndex}`}
                                                className="calendar-day calendar-day-empty"
                                            />
                                        );
                                    }

                                    const dateString = formatIsoDate(date);
                                    const dayOfWeek = date.getUTCDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    const inSprint = dateString >= startDate && dateString <= endDate;
                                    const isHoliday = holidays.has(dateString);
                                    const activities = dayActivity[dateString] ?? [];
                                    const canToggleHoliday = inSprint && !isWeekend;

                                    let cellClass: string = "calendar-day";
                                    if (!inSprint || isWeekend) {
                                        cellClass += " calendar-day-muted";
                                    } else if (isHoliday) {
                                        cellClass += " calendar-day-holiday";
                                    } else {
                                        cellClass += " calendar-day-active";
                                    }

                                    return (
                                        <div
                                            key={dateString}
                                            className={cellClass}
                                            onClick={canToggleHoliday ? () => onToggleHoliday(dateString) : undefined}
                                            title={canToggleHoliday ? "click to toggle holiday" : undefined}
                                        >
                                            <span className="calendar-day-number">{date.getUTCDate()}</span>
                                            {inSprint && !isWeekend && !isHoliday && activities.length > 0 && (
                                                <div className="calendar-day-activity">
                                                    {activities.slice(0, MAX_VISIBLE_CHIPS).map((entry, index) =>
                                                        entry.prUrl ? (
                                                            <a
                                                                key={index}
                                                                href={entry.prUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="calendar-day-activity-chip calendar-day-activity-chip-link"
                                                                style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                                                                title={activityTitle(entry)}
                                                                onClick={(event) => event.stopPropagation()}
                                                            >
                                                                {entry.storyLabel} {entry.branchName}
                                                            </a>
                                                        ) : (
                                                            <span
                                                                key={index}
                                                                className="calendar-day-activity-chip"
                                                                style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                                                                title={activityTitle(entry)}
                                                            >
                                                                {entry.storyLabel} {entry.branchName}
                                                            </span>
                                                        )
                                                    )}
                                                    {activities.length > MAX_VISIBLE_CHIPS && (
                                                        <span
                                                            className="calendar-day-activity-chip calendar-day-activity-more"
                                                            title={activities
                                                                .slice(MAX_VISIBLE_CHIPS)
                                                                .map(activityTitle)
                                                                .join("\n")}
                                                        >
                                                            +{activities.length - MAX_VISIBLE_CHIPS} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
