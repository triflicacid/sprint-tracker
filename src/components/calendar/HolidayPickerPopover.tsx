import React, { useState } from "react";
import { parseIsoDate } from "../../utils/calendarGrid";
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

// sprint detail page's holiday editor: a popover showing one month at a
// time, with '<'/'>' chevrons to navigate - clicking a day toggles it as a
// holiday. stays open across clicks so multiple days can be toggled in one
// sitting. navigation is clamped to the months spanned by the sprint's own
// date range (days outside it aren't toggleable, so there's nothing to
// browse to beyond that); weekends aren't toggleable either. hidden
// entirely on a locked sprint - no editing affordance at all, matching the
// read-only chip list next to it.
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
