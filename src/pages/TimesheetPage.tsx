import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { CalendarGridMonth } from "../components/calendar/CalendarGridMonth";
import { DayActivityChips } from "../components/calendar/DayActivityChips";
import { SprintRangeCalendar } from "../components/calendar/SprintRangeCalendar";
import { TagFilter } from "../components/TagFilter";
import { groupActivitiesByStory } from "../utils/dayActivity";
import { formatIsoDate } from "../utils/calendarGrid";
import type { CalendarEntry, DayActivityMap, Tag } from "@shared/types";
import "../components/calendar/calendar.css";
import "../components/stats/statsShared.css";
import "./TimesheetPage.css";

type Mode = "stories" | "sprints";

// "/timesheet": two lenses on the same big calendar. "stories" is one
// freely-navigable month, showing every story worked on each day across all
// sprints, and doubling as the holiday editor (same global holiday store as
// the sprint detail page's HolidayPickerPopover) except a past day can't be
// (un)marked as a holiday retroactively. "sprints" is every sprint as a
// range-line, filterable by repo/tag - the former standalone "/calendar"
// page, folded in here rather than kept as a near-duplicate view.
export function TimesheetPage(): React.ReactElement {
    const [mode, setMode] = useState<Mode>("stories");

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">
                        back to sprints
                    </Link>
                    <h1>Timesheet</h1>
                </div>
                <div className="page-header-actions">
                    <div className="granularity-toggle">
                        <button className={mode === "stories" ? "active" : ""} onClick={() => setMode("stories")}>
                            stories
                        </button>
                        <button className={mode === "sprints" ? "active" : ""} onClick={() => setMode("sprints")}>
                            sprints
                        </button>
                    </div>
                </div>
            </div>

            {mode === "stories" ? <StoryTimesheet /> : <SprintTimesheet />}
        </div>
    );
}

// one navigable month: click a day to toggle it as a holiday (today/future,
// non-weekend only), and see every story worked on that day.
function StoryTimesheet(): React.ReactElement {
    const today = new Date();
    const todayIso = formatIsoDate(today);
    const [year, setYear] = useState<number>(today.getUTCFullYear());
    const [month, setMonth] = useState<number>(today.getUTCMonth());
    const [dayActivity, setDayActivity] = useState<DayActivityMap>({});
    const [holidays, setHolidays] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.getAllDayActivity().then(setDayActivity);
    }, []);

    function monthBounds(): [string, string] {
        return [
            formatIsoDate(new Date(Date.UTC(year, month, 1))),
            formatIsoDate(new Date(Date.UTC(year, month + 1, 0))),
        ];
    }

    async function loadHolidays() {
        const [start, end] = monthBounds();
        const dates = await api.listHolidays(start, end);
        setHolidays(new Set(dates));
    }

    useEffect(() => {
        loadHolidays();
    }, [year, month]);

    async function handleToggleHoliday(date: string) {
        if (holidays.has(date)) {
            await api.removeHoliday(date);
        } else {
            await api.addHoliday(date);
        }
        loadHolidays();
    }

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

    function goToToday() {
        setYear(today.getUTCFullYear());
        setMonth(today.getUTCMonth());
    }

    return (
        <>
            <div className="timesheet-toolbar">
                <button onClick={goToToday}>today</button>
            </div>
            <div className="timesheet-calendar">
                <CalendarGridMonth
                    year={year}
                    month={month}
                    onPreviousMonth={goToPreviousMonth}
                    onNextMonth={goToNextMonth}
                    renderDay={(date, { dateString, isWeekend }) => {
                        const isHoliday = holidays.has(dateString);
                        const isPast = dateString < todayIso;
                        const canToggle = !isWeekend && !isPast;
                        // nobody's working weekends - don't clutter them with chips.
                        const activities = isWeekend ? [] : groupActivitiesByStory(dayActivity[dateString] ?? []);

                        let cellClass = "calendar-day";
                        if (isWeekend) {
                            cellClass += " calendar-day-muted";
                        } else if (isHoliday) {
                            cellClass += " calendar-day-holiday";
                        } else {
                            cellClass += " calendar-day-active";
                        }
                        if (canToggle) {
                            cellClass += " calendar-day-clickable";
                        }
                        if (dateString === todayIso) {
                            cellClass += " timesheet-day-today";
                        }

                        return (
                            <div
                                className={cellClass}
                                onClick={canToggle ? () => handleToggleHoliday(dateString) : undefined}
                                title={canToggle ? "click to toggle holiday" : undefined}
                            >
                                <span className="calendar-day-number">{date.getUTCDate()}</span>
                                <DayActivityChips activities={activities} linkMode="story" />
                            </div>
                        );
                    }}
                />
            </div>
        </>
    );
}

// every sprint as a range-line, filterable by repo/tag, one navigable month
// at a time - the "sprints" counterpart to StoryTimesheet above. day numbers
// double as the same global holiday editor as the stories view, toggling any
// today-or-future weekday in the visible month.
function SprintTimesheet(): React.ReactElement {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getUTCFullYear());
    const [month, setMonth] = useState<number>(today.getUTCMonth());
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [repoFilter, setRepoFilter] = useState<string>("");
    const [tagFilter, setTagFilter] = useState<string>("");
    const [holidays, setHolidays] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.listTags().then(setTags);
    }, []);

    useEffect(() => {
        api.getCalendar({ repo: repoFilter || undefined, tag: tagFilter || undefined }).then(setEntries);
    }, [repoFilter, tagFilter]);

    function monthBounds(): [string, string] {
        return [
            formatIsoDate(new Date(Date.UTC(year, month, 1))),
            formatIsoDate(new Date(Date.UTC(year, month + 1, 0))),
        ];
    }

    async function loadHolidays() {
        const [start, end] = monthBounds();
        const dates = await api.listHolidays(start, end);
        setHolidays(new Set(dates));
    }

    useEffect(() => {
        loadHolidays();
    }, [year, month]);

    async function handleToggleHoliday(date: string) {
        if (holidays.has(date)) {
            await api.removeHoliday(date);
        } else {
            await api.addHoliday(date);
        }
        loadHolidays();
    }

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

    function goToToday() {
        setYear(today.getUTCFullYear());
        setMonth(today.getUTCMonth());
    }

    const repoTags = tags.filter((tag) => tag.tagType === "repo");
    const customTags = tags.filter((tag) => tag.tagType === "custom");

    return (
        <>
            <div className="timesheet-toolbar">
                <TagFilter tags={repoTags} selected={repoFilter} onChange={setRepoFilter} label="repo" />
                <TagFilter tags={customTags} selected={tagFilter} onChange={setTagFilter} label="tag" />
                <button onClick={goToToday}>today</button>
            </div>
            <div className="timesheet-calendar">
                <SprintRangeCalendar
                    entries={entries}
                    year={year}
                    month={month}
                    onPreviousMonth={goToPreviousMonth}
                    onNextMonth={goToNextMonth}
                    holidays={holidays}
                    onToggleHoliday={handleToggleHoliday}
                />
            </div>
        </>
    );
}
