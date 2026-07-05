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
});
