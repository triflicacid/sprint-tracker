import React from "react";
import { buildMonthGrid, formatIsoDate } from "../../utils/calendarGrid";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface CalendarDayInfo {
    dateString: string;
    isWeekend: boolean;
}

interface CalendarGridMonthProps {
    year: number;
    month: number;
    renderDay: (date: Date, info: CalendarDayInfo) => React.ReactNode;
    /** when provided, renders navigation chevrons flanking the month title */
    onPreviousMonth?: () => void;
    onNextMonth?: () => void;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
}

/**
 * one month's calendar grid with optional navigation
 *
 * cell content and interactivity fully delegated via renderDay
 *
 * @param year year
 * @param month month (0-11)
 * @param renderDay callback to render each day cell
 * @param onPreviousMonth callback for previous month navigation
 * @param onNextMonth callback for next month navigation
 * @param previousDisabled if true, disables previous month button
 * @param nextDisabled if true, disables next month button
 */
export function CalendarGridMonth({
    year,
    month,
    renderDay,
    onPreviousMonth,
    onNextMonth,
    previousDisabled,
    nextDisabled,
}: CalendarGridMonthProps) {
    const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
    const weeks = buildMonthGrid(year, month);
    const hasNav = Boolean(onPreviousMonth || onNextMonth);

    return (
        <div className="calendar-month">
            {hasNav ? (
                <div className="calendar-month-header">
                    <button
                        type="button"
                        className="calendar-month-nav"
                        onClick={onPreviousMonth}
                        disabled={previousDisabled}
                        aria-label="previous month"
                    >
                        &lt;
                    </button>
                    <h3 className="calendar-month-title">{monthLabel}</h3>
                    <button
                        type="button"
                        className="calendar-month-nav"
                        onClick={onNextMonth}
                        disabled={nextDisabled}
                        aria-label="next month"
                    >
                        &gt;
                    </button>
                </div>
            ) : (
                <h3 className="calendar-month-title">{monthLabel}</h3>
            )}
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
                                <div key={`${weekIndex}-${dayIndex}`} className="calendar-day calendar-day-empty" />
                            );
                        }
                        const dateString = formatIsoDate(date);
                        const dayOfWeek = date.getUTCDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        return (
                            <React.Fragment key={dateString}>
                                {renderDay(date, { dateString, isWeekend })}
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </div>
    );
}
