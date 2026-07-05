import React from "react";
import type { StatusHistoryEntry } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";
import { buildMonthGrid, formatIsoDate, monthsBetween } from "../../utils/calendarGrid";

interface SubtaskActivityCalendarProps {
    history: StatusHistoryEntry[];
    // when set, active days open this subtask's pr on click.
    prUrl?: string | null;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// a subtask is "active" from the day it leaves NEW to the day it
// reaches DONE (or today, if not yet done)
// NOTE same as server impl
function statusAsOf(sortedHistory: StatusHistoryEntry[], dateString: string) {
    let status: string = "NEW";
    for (const entry of sortedHistory) {
        if (entry.changedAt.slice(0, 10) <= dateString) {
            status = entry.status;
        } else {
            break;
        }
    }
    return status;
}

// one subtask's day-by-day activity, on its detail page.
export function SubtaskActivityCalendar({ history, prUrl }: SubtaskActivityCalendarProps) {
    const sortedHistory = [...history].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );

    const firstActiveEntry = sortedHistory.find((entry) => entry.status !== "NEW");
    if (!firstActiveEntry) {
        return <p className="activity-calendar-empty">not started yet.</p>;
    }

    const doneEntry = sortedHistory.find((entry) => entry.status === "DONE");
    const startDate = firstActiveEntry.changedAt.slice(0, 10);
    const endDate = doneEntry ? doneEntry.changedAt.slice(0, 10) : formatIsoDate(new Date());

    const months = monthsBetween(startDate, endDate);

    return (
        <div className="sprint-calendar activity-calendar">
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
                                    const isActive = dateString >= startDate && dateString <= endDate;
                                    const status = isActive ? statusAsOf(sortedHistory, dateString) : "";
                                    const baseTitle = `${dateString} — ${STATUS_LABELS[status] ?? status}`;

                                    if (isActive && prUrl) {
                                        return (
                                            <a
                                                key={dateString}
                                                href={prUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="calendar-day calendar-day-link"
                                                style={{ backgroundColor: STATUS_COLORS[status] }}
                                                title={`${baseTitle} (click to open PR)`}
                                            >
                                                <span className="calendar-day-number">{date.getUTCDate()}</span>
                                            </a>
                                        );
                                    }

                                    return (
                                        <div
                                            key={dateString}
                                            className={isActive ? "calendar-day" : "calendar-day calendar-day-muted"}
                                            style={isActive ? { backgroundColor: STATUS_COLORS[status] } : undefined}
                                            title={isActive ? baseTitle : undefined}
                                        >
                                            <span className="calendar-day-number">{date.getUTCDate()}</span>
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
