import React from "react";
import type { StatusHistoryEntry, SubtaskStatus } from "@shared/types";
import type { StatusHistoryLike } from "@shared/statusHistory";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";
import { buildMonthGrid, formatIsoDate, monthsBetween } from "../../utils/calendarGrid";
import { computeDaySegments } from "../../utils/dayStatusSegments";

interface SubtaskActivityCalendarProps {
    history: StatusHistoryEntry[];
    // when set, active days open this subtask's pr on click.
    prUrl?: string | null;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// one subtask's day-by-day activity, on its detail page
export function SubtaskActivityCalendar({ history, prUrl }: SubtaskActivityCalendarProps) {
    const sortedHistory: StatusHistoryLike[] = [...history]
        .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
        .map((entry) => ({ status: entry.status as SubtaskStatus, changedAt: entry.changedAt }));

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
                                    const segments = isActive ? computeDaySegments(sortedHistory, dateString) : [];
                                    const lastStatus = segments[segments.length - 1]?.status ?? "";
                                    const baseTitle = isActive
                                        ? `${dateString} — ${segments
                                              .map((segment) => STATUS_LABELS[segment.status] ?? segment.status.toLowerCase())
                                              .join(" → ")}`
                                        : "";
                                    // only a day with several transitions gets the proportional-width segment strips.
                                    const cellStyle = isActive && segments.length <= 1
                                        ? { backgroundColor: STATUS_COLORS[lastStatus] }
                                        : undefined;
                                    const segmentsOverlay =
                                        segments.length > 1 ? (
                                            <div className="calendar-day-segments">
                                                {segments.map((segment, segmentIndex) => (
                                                    <div
                                                        key={segmentIndex}
                                                        className="calendar-day-segment"
                                                        style={{
                                                            flexGrow: segment.durationMs,
                                                            backgroundColor: STATUS_COLORS[segment.status],
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ) : null;

                                    if (isActive && prUrl) {
                                        return (
                                            <a
                                                key={dateString}
                                                href={prUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="calendar-day calendar-day-link"
                                                style={cellStyle}
                                                title={`${baseTitle} (click to open PR)`}
                                            >
                                                {segmentsOverlay}
                                                <span className="calendar-day-number">{date.getUTCDate()}</span>
                                            </a>
                                        );
                                    }

                                    return (
                                        <div
                                            key={dateString}
                                            className={isActive ? "calendar-day" : "calendar-day calendar-day-muted"}
                                            style={isActive ? cellStyle : undefined}
                                            title={isActive ? baseTitle : undefined}
                                        >
                                            {segmentsOverlay}
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
