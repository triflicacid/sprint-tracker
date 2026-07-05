import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { CalendarEntry } from "@shared/types";
import { SprintRangeCalendar } from "./SprintRangeCalendar";

function renderCalendar(entries: CalendarEntry[]) {
    return render(
        <MemoryRouter>
            <SprintRangeCalendar entries={entries} />
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
        renderCalendar([{ sprintId: 3, sprintName: "Sprint 3", startDate: "2026-03-30", endDate: null, repos: [], tags: [] }]);
        expect(screen.getByText("April 2026")).toBeInTheDocument();
    });
});
