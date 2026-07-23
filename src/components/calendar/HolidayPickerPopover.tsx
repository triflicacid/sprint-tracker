import React, { useState } from "react";
import { parseIsoDate } from "#utils/calendarGrid";
import { CalendarGridMonth } from "./CalendarGridMonth";
import { CalendarPopoverShell } from "./CalendarPopoverShell";
import "./calendar.css";
import "./HolidayPickerPopover.css";

interface HolidayPickerPopoverProps {
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    onToggleHoliday: (date: string) => void;
    locked?: boolean;
}

/**
 * holiday editor popover for sprint detail page
 *
 * shows one month at a time with navigation, clicking a day toggles it as a holiday,
 * stays open for multiple toggles, navigation clamped to sprint date range, weekends
 * not toggleable, hidden entirely when sprint is locked
 *
 * @param startDate sprint start date
 * @param endDate sprint end date
 * @param holidays set of holiday date strings
 * @param onToggleHoliday callback when a day is toggled
 * @param locked if true, hides the component entirely
 */
export function HolidayPickerPopover({
    startDate,
    endDate,
    holidays,
    onToggleHoliday,
    locked,
}: HolidayPickerPopoverProps) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    const [year, setYear] = useState<number>(start.getUTCFullYear());
    const [month, setMonth] = useState<number>(start.getUTCMonth());

    if (locked) {
        return null;
    }

    const cursorIndex = year * 12 + month;
    const startIndex = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const endIndex = end.getUTCFullYear() * 12 + end.getUTCMonth();
    const atStart = cursorIndex <= startIndex;
    const atEnd = cursorIndex >= endIndex;

    function goToPreviousMonth() {
        if (atStart) {
            return;
        }
        if (month === 0) {
            setYear((current) => current - 1);
            setMonth(11);
        } else {
            setMonth((current) => current - 1);
        }
    }

    function goToNextMonth() {
        if (atEnd) {
            return;
        }
        if (month === 11) {
            setYear((current) => current + 1);
            setMonth(0);
        } else {
            setMonth((current) => current + 1);
        }
    }

    return (
        <CalendarPopoverShell triggerLabel="edit holidays">
            {() => (
                <div className="holiday-picker-popover">
                    <CalendarGridMonth
                        year={year}
                        month={month}
                        onPreviousMonth={goToPreviousMonth}
                        onNextMonth={goToNextMonth}
                        previousDisabled={atStart}
                        nextDisabled={atEnd}
                        renderDay={(date, { dateString, isWeekend }) => {
                            const inSprint = dateString >= startDate && dateString <= endDate;
                            const isHoliday = holidays.has(dateString);
                            const canToggle = inSprint && !isWeekend;

                            let cellClass = "calendar-day";
                            if (!inSprint || isWeekend) {
                                cellClass += " calendar-day-muted";
                            } else if (isHoliday) {
                                cellClass += " calendar-day-holiday";
                            } else {
                                cellClass += " calendar-day-active";
                            }
                            if (canToggle) {
                                cellClass += " calendar-day-clickable";
                            }

                            return (
                                <div
                                    className={cellClass}
                                    onClick={canToggle ? () => onToggleHoliday(dateString) : undefined}
                                    title={canToggle ? "click to toggle holiday" : undefined}
                                >
                                    <span className="calendar-day-number">{date.getUTCDate()}</span>
                                </div>
                            );
                        }}
                    />
                </div>
            )}
        </CalendarPopoverShell>
    );
}
