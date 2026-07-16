import React from "react";
import type { DayActivityMap } from "@shared/types";
import { monthsBetween } from "../../utils/calendarGrid";
import { CalendarGridMonth } from "./CalendarGridMonth";
import { DayActivityChips } from "./DayActivityChips";
import "./calendar.css";

interface SprintActivityCalendarProps {
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    dayActivity: DayActivityMap;
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
                                {inSprint && !isWeekend && !isHoliday && (
                                    <DayActivityChips activities={activities} />
                                )}
                            </div>
                        );
                    }}
                />
            ))}
        </div>
    );
}
