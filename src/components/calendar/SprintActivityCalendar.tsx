import React from "react";
import type { DayActivityMap, DayActivityEntry } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";
import { monthsBetween } from "../../utils/calendarGrid";
import { CalendarGridMonth } from "./CalendarGridMonth";
import "./calendar.css";

interface SprintActivityCalendarProps {
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    dayActivity: DayActivityMap;
}

const MAX_VISIBLE_CHIPS = 4;

function activityTitle(entry: DayActivityEntry) {
    const base = `${entry.storyLabel} ${entry.branchName} - ${STATUS_LABELS[entry.status] ?? entry.status}`;
    return entry.prUrl ? `${base} (click to open PR)` : base;
}

// one sprint's day-by-day activity, read-only. holiday editing lives on the
// sprint detail page's HolidayPickerPopover, not here.
export function SprintActivityCalendar({ startDate, endDate, holidays, dayActivity }: SprintActivityCalendarProps) {
    const months = monthsBetween(startDate, endDate);

    return (
        <div className="sprint-calendar">
            {months.map(({ year, month }) => (
                <CalendarGridMonth
                    key={`${year}-${month}`}
                    year={year}
                    month={month}
                    renderDay={(date, { dateString, isWeekend }) => {
                        const inSprint = dateString >= startDate && dateString <= endDate;
                        const isHoliday = holidays.has(dateString);
                        const activities = dayActivity[dateString] ?? [];

                        let cellClass: string = "calendar-day";
                        if (!inSprint || isWeekend) {
                            cellClass += " calendar-day-muted";
                        } else if (isHoliday) {
                            cellClass += " calendar-day-holiday";
                        } else {
                            cellClass += " calendar-day-active";
                        }

                        return (
                            <div className={cellClass}>
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
                    }}
                />
            ))}
        </div>
    );
}
