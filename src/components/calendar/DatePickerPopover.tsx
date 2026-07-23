import React, { useState } from "react";
import { parseIsoDate } from "#utils/calendarGrid";
import { CalendarGridMonth } from "./CalendarGridMonth";
import { CalendarPopoverShell } from "./CalendarPopoverShell";
import "./calendar.css";
import "./DatePickerPopover.css";

interface DatePickerPopoverProps {
    label: string;
    value: string;
    onSelect: (date: string) => void;
}

const MONTH_NAMES: string[] = Array.from({ length: 12 }, (_, index) =>
    new Date(Date.UTC(2000, index, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" })
);

/**
 * styled date picker with calendar popover
 * 
 * single-select, closes on pick, unbounded month navigation, weekends clickable
 * 
 * @param label button label
 * @param value current ISO date value
 * @param onSelect callback when a date is selected
 */
export function DatePickerPopover({ label, value, onSelect }: DatePickerPopoverProps) {
    const initial = value ? parseIsoDate(value) : new Date();
    const [year, setYear] = useState<number>(initial.getUTCFullYear());
    const [month, setMonth] = useState<number>(initial.getUTCMonth());

    function goToPreviousMonth() {
        if (month === 0) {
            setYear((current) => current - 1);
            setMonth(11);
        } else {
            setMonth((current) => current - 1);
        }
    }

    function goToNextMonth() {
        if (month === 11) {
            setYear((current) => current + 1);
            setMonth(0);
        } else {
            setMonth((current) => current + 1);
        }
    }

    const triggerText = value || `select ${label} date`;

    return (
        <CalendarPopoverShell triggerLabel={triggerText} triggerAriaLabel={triggerText}>
            {(close) => (
                <div className="date-picker-popover">
                    <div className="date-picker-nav">
                        <button type="button" onClick={goToPreviousMonth} aria-label="previous month">
                            &lt;
                        </button>
                        <select aria-label="month" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                            {MONTH_NAMES.map((name, index) => (
                                <option key={name} value={index}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            aria-label="year"
                            className="date-picker-year"
                            value={year}
                            onChange={(event) => {
                                const parsed = Number(event.target.value);
                                if (!Number.isNaN(parsed)) {
                                    setYear(parsed);
                                }
                            }}
                        />
                        <button type="button" onClick={goToNextMonth} aria-label="next month">
                            &gt;
                        </button>
                    </div>
                    <CalendarGridMonth
                        year={year}
                        month={month}
                        renderDay={(date, { dateString }) => {
                            const isSelected = dateString === value;
                            const cellClass = `calendar-day calendar-day-clickable ${
                                isSelected ? "calendar-day-selected" : "calendar-day-active"
                            }`;

                            return (
                                <div
                                    className={cellClass}
                                    onClick={() => {
                                        onSelect(dateString);
                                        close();
                                    }}
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
