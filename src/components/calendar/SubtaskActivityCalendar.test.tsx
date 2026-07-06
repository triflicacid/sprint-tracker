import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { StatusHistoryEntry } from "@shared/types";
import { SubtaskActivityCalendar } from "./SubtaskActivityCalendar";

const notStarted: StatusHistoryEntry[] = [
    { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-03-01" },
];

const inProgress: StatusHistoryEntry[] = [
    { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-03-01" },
    { id: 2, entityType: "subtask", entityId: 1, status: "WIP", releaseVersion: null, changedAt: "2026-03-02" },
];

const done: StatusHistoryEntry[] = [
    { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-03-01" },
    { id: 2, entityType: "subtask", entityId: 1, status: "WIP", releaseVersion: null, changedAt: "2026-03-02" },
    { id: 3, entityType: "subtask", entityId: 1, status: "DONE", releaseVersion: null, changedAt: "2026-03-05" },
];

// wip carries over from 03-04 (so 03-05 doesn't also inherit a NEW sliver),
// then three more transitions land on 2026-03-05 itself, and a DONE the next
// day bounds the rendered calendar to a single month for a stable query.
const multiTransitionDay: StatusHistoryEntry[] = [
    { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-03-01" },
    { id: 2, entityType: "subtask", entityId: 1, status: "WIP", releaseVersion: null, changedAt: "2026-03-04 09:00:00" },
    { id: 3, entityType: "subtask", entityId: 1, status: "PR_COMMENTS", releaseVersion: null, changedAt: "2026-03-05 10:00:00" },
    { id: 4, entityType: "subtask", entityId: 1, status: "IN_REVIEW", releaseVersion: null, changedAt: "2026-03-05 17:00:00" },
    { id: 5, entityType: "subtask", entityId: 1, status: "CUT_RELEASE", releaseVersion: null, changedAt: "2026-03-05 19:00:00" },
    { id: 6, entityType: "subtask", entityId: 1, status: "DONE", releaseVersion: null, changedAt: "2026-03-06 09:00:00" },
];

describe("SubtaskActivityCalendar", () => {
    it("shows a message instead of a calendar when the subtask never left NEW", () => {
        render(<SubtaskActivityCalendar history={notStarted} />);
        expect(screen.getByText("not started yet.")).toBeInTheDocument();
    });

    it("renders the month the subtask became active in", () => {
        render(<SubtaskActivityCalendar history={inProgress} />);
        expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("colors an active day plain (no link) when there is no pr url", () => {
        const { container } = render(<SubtaskActivityCalendar history={done} />);
        const day = screen.getByText("2").closest(".calendar-day");
        expect(day?.tagName).toBe("DIV");
        expect((day as HTMLElement).style.backgroundColor).not.toBe("");
        expect(container.querySelector("a.calendar-day-link")).toBeNull();
    });

    it("renders active days as pr links when a pr url is given", () => {
        render(<SubtaskActivityCalendar history={done} prUrl="https://github.com/org/repo/pull/9" />);
        const day = screen.getByText("2").closest(".calendar-day");
        expect(day?.tagName).toBe("A");
        expect(day).toHaveAttribute("href", "https://github.com/org/repo/pull/9");
    });

    it("does not extend the pr link past the day the subtask reached DONE", () => {
        render(<SubtaskActivityCalendar history={done} prUrl="https://github.com/org/repo/pull/9" />);
        const dayAfterDone = screen.getByText("6").closest(".calendar-day");
        expect(dayAfterDone?.tagName).toBe("DIV");
        expect(dayAfterDone).toHaveClass("calendar-day-muted");
    });

    it("renders a plain solid background (no segment strips) for a day with only one status", () => {
        const { container } = render(<SubtaskActivityCalendar history={done} />);
        const day = screen.getByText("2").closest(".calendar-day") as HTMLElement;
        expect(day.style.backgroundColor).not.toBe("");
        expect(day.querySelector(".calendar-day-segments")).toBeNull();
        expect(container.querySelectorAll(".calendar-day-segment")).toHaveLength(0);
    });

    it("splits a day with multiple transitions into proportional-width segment strips", () => {
        render(<SubtaskActivityCalendar history={multiTransitionDay} />);
        const day = screen.getByText("5").closest(".calendar-day") as HTMLElement;
        // the cell itself no longer carries a single flat background color -
        // that's now expressed as four child strips instead.
        expect(day.style.backgroundColor).toBe("");
        const segments = day.querySelectorAll(".calendar-day-segment");
        expect(segments).toHaveLength(4);
        // proportional to time held: wip carries over from the day before
        // until 10:00 (10h), then 10:00->17:00 (7h), 17:00->19:00 (2h),
        // 19:00->midnight (5h) - flexGrow carries the relative proportion.
        expect((segments[0] as HTMLElement).style.flexGrow).toBe(String(10 * 60 * 60 * 1000));
        expect((segments[1] as HTMLElement).style.flexGrow).toBe(String(7 * 60 * 60 * 1000));
        expect((segments[2] as HTMLElement).style.flexGrow).toBe(String(2 * 60 * 60 * 1000));
        expect((segments[3] as HTMLElement).style.flexGrow).toBe(String(5 * 60 * 60 * 1000));
    });

    it("lists every status the day held, in order, in the cell's tooltip title", () => {
        render(<SubtaskActivityCalendar history={multiTransitionDay} />);
        const day = screen.getByText("5").closest(".calendar-day") as HTMLElement;
        expect(day).toHaveAttribute("title", "2026-03-05 — wip → pr comments → in review → cut release");
    });
});
