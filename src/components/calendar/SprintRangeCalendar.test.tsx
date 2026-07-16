import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { CalendarEntry } from "@shared/types";
import { SprintRangeCalendar } from "./SprintRangeCalendar";

function renderCalendar(
    entries: CalendarEntry[],
    options?: {
        year?: number;
        month?: number;
        holidays?: Set<string>;
        onToggleHoliday?: (date: string) => void;
        onPreviousMonth?: () => void;
        onNextMonth?: () => void;
    }
) {
    // defaults to march 2026, since that's the month every fixed-date test
    // fixture below falls in.
    return render(
        <MemoryRouter>
            <SprintRangeCalendar
                entries={entries}
                year={options?.year ?? 2026}
                month={options?.month ?? 2}
                onPreviousMonth={options?.onPreviousMonth}
                onNextMonth={options?.onNextMonth}
                holidays={options?.holidays}
                onToggleHoliday={options?.onToggleHoliday}
            />
        </MemoryRouter>
    );
}

afterEach(() => {
    vi.useRealTimers();
});

describe("SprintRangeCalendar", () => {
    it("shows a message instead of a grid when there are no sprints", () => {
        renderCalendar([]);
        expect(screen.getByText("no sprints match this filter.")).toBeInTheDocument();
    });

    it("renders a single sprint as a range-line linking to its detail page", () => {
        renderCalendar([
            { sprintId: 1, sprintName: "Sprint 1", startDate: "2026-03-02", endDate: "2026-03-16", repos: ["checkout-web"], tags: [] },
        ]);
        // the sprint's name is repeated at the start of every week row it spans => more than one match
        const bars = screen.getAllByText("Sprint 1");
        expect(bars.length).toBeGreaterThan(0);
        for (const bar of bars) {
            expect(bar).toHaveAttribute("href", "/sprints/1");
            expect(bar).toHaveAttribute("title", expect.stringContaining("checkout-web"));
        }
    });

    it("keeps two sequential sprints in the same lane and splits their shared handoff day in half", () => {
        const { container } = renderCalendar([
            { sprintId: 1, sprintName: "Sprint 1", startDate: "2026-03-02", endDate: "2026-03-16", repos: [], tags: [] },
            { sprintId: 2, sprintName: "Sprint 2", startDate: "2026-03-16", endDate: "2026-03-30", repos: [], tags: [] },
        ]);
        // only one lane row per week when sprints don't genuinely overlap
        const weekWithHandoff = Array.from(container.querySelectorAll(".range-week")).find((week) =>
            week.textContent?.includes("16")
        );
        expect(weekWithHandoff?.querySelectorAll(".range-lane")).toHaveLength(1);

        const bars = weekWithHandoff!.querySelectorAll(".range-bar");
        expect(bars).toHaveLength(2);
        // Both end/start at day 16's midpoint - grid-column ranges must be adjacent, not overlapping.
        const [bar1Style, bar2Style] = Array.from(bars).map((bar) => (bar as HTMLElement).style.gridColumn);
        const bar1End = bar1Style.split("/")[1].trim();
        const bar2Start = bar2Style.split("/")[0].trim();
        expect(bar1End).toBe(bar2Start);
    });

    it("stacks genuinely overlapping sprints into separate lanes", () => {
        const { container } = renderCalendar([
            { sprintId: 1, sprintName: "Sprint 1", startDate: "2026-03-02", endDate: "2026-03-20", repos: [], tags: [] },
            { sprintId: 2, sprintName: "Sprint 2", startDate: "2026-03-10", endDate: "2026-03-25", repos: [], tags: [] },
        ]);
        const weekWithOverlap = Array.from(container.querySelectorAll(".range-week")).find((week) =>
            week.textContent?.includes("10")
        );
        expect(weekWithOverlap?.querySelectorAll(".range-lane").length).toBeGreaterThanOrEqual(2);
    });

    it("extends an ongoing sprint (no end date) through today", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-15T00:00:00Z"));
        const { container } = renderCalendar(
            [{ sprintId: 3, sprintName: "Sprint 3", startDate: "2026-03-30", endDate: null, repos: [], tags: [] }],
            { year: 2026, month: 3 }
        );
        expect(screen.getByText("April 2026")).toBeInTheDocument();

        const weeks = Array.from(container.querySelectorAll(".range-week"));
        const weekWithToday = weeks.find((week) => week.textContent?.includes("15"));
        const weekAfterToday = weeks.find((week) => week.textContent?.includes("20"));

        // the bar reaches today (04-15) but no further.
        expect(weekWithToday?.querySelector(".range-bar")).not.toBeNull();
        expect(weekAfterToday?.querySelector(".range-bar")).toBeNull();
    });

    describe("month navigation", () => {
        const entries: CalendarEntry[] = [
            { sprintId: 1, sprintName: "Sprint 1", startDate: "2026-03-02", endDate: "2026-03-16", repos: [], tags: [] },
        ];

        it("renders only the given month, not the sprint's full range", () => {
            renderCalendar(entries, { onPreviousMonth: vi.fn(), onNextMonth: vi.fn() });
            expect(screen.getByText("March 2026")).toBeInTheDocument();
            expect(screen.queryByText("April 2026")).not.toBeInTheDocument();
        });

        it("calls onPreviousMonth/onNextMonth when the nav chevrons are clicked", () => {
            const onPreviousMonth = vi.fn();
            const onNextMonth = vi.fn();
            renderCalendar(entries, { onPreviousMonth, onNextMonth });

            fireEvent.click(screen.getByRole("button", { name: "previous month" }));
            expect(onPreviousMonth).toHaveBeenCalledOnce();

            fireEvent.click(screen.getByRole("button", { name: "next month" }));
            expect(onNextMonth).toHaveBeenCalledOnce();
        });

        it("omits the nav chevrons when neither handler is given", () => {
            renderCalendar(entries);
            expect(screen.queryByRole("button", { name: "previous month" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "next month" })).not.toBeInTheDocument();
        });
    });

    describe("holiday toggling", () => {
        const entries: CalendarEntry[] = [
            { sprintId: 1, sprintName: "Sprint 1", startDate: "2026-03-02", endDate: "2026-03-16", repos: [], tags: [] },
        ];

        // pinned to 2026-03-10, a tuesday - matches the "today" used by
        // TimesheetPage's own tests, so date-math here is easy to check by hand.
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
        });

        it("marks a date in the holidays set with the holiday class", () => {
            const { container } = renderCalendar(entries, { holidays: new Set(["2026-03-11"]) });
            const day = screen.getByText("11", { selector: ".range-day-number" });
            expect(day).toHaveClass("range-day-number-holiday");
            expect(container.querySelectorAll(".range-day-number-holiday")).toHaveLength(1);
        });

        it("toggles a today-or-future weekday when clicked", () => {
            const onToggleHoliday = vi.fn();
            renderCalendar(entries, { holidays: new Set(), onToggleHoliday });

            // 2026-03-11 is a wednesday, after "today" (2026-03-10).
            const day = screen.getByText("11", { selector: ".range-day-number" });
            expect(day).toHaveClass("range-day-number-clickable");
            fireEvent.click(day);
            expect(onToggleHoliday).toHaveBeenCalledWith("2026-03-11");
        });

        it("does not allow toggling a day in the past", () => {
            const onToggleHoliday = vi.fn();
            renderCalendar(entries, { holidays: new Set(), onToggleHoliday });

            // 2026-03-09 is a monday, before "today" (2026-03-10).
            const day = screen.getByText("9", { selector: ".range-day-number" });
            expect(day).not.toHaveClass("range-day-number-clickable");
            fireEvent.click(day);
            expect(onToggleHoliday).not.toHaveBeenCalled();
        });

        it("does not allow toggling a weekend day", () => {
            const onToggleHoliday = vi.fn();
            renderCalendar(entries, { holidays: new Set(), onToggleHoliday });

            // 2026-03-14 is a saturday, in the future.
            const day = screen.getByText("14", { selector: ".range-day-number" });
            expect(day).not.toHaveClass("range-day-number-clickable");
            fireEvent.click(day);
            expect(onToggleHoliday).not.toHaveBeenCalled();
        });

        it("is not clickable at all when no onToggleHoliday is given", () => {
            renderCalendar(entries, { holidays: new Set() });
            const day = screen.getByText("11", { selector: ".range-day-number" });
            expect(day).not.toHaveClass("range-day-number-clickable");
        });
    });
});
