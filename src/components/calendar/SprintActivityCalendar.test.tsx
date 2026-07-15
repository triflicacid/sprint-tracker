import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DayActivityMap } from "@shared/types";
import { SprintActivityCalendar } from "./SprintActivityCalendar";

describe("SprintActivityCalendar", () => {
    it("renders a month header for the sprint's range", () => {
        render(
            <SprintActivityCalendar startDate="2026-03-02" endDate="2026-03-16" holidays={new Set()} dayActivity={{}} />
        );
        expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("shows activity chips for an active in-sprint day", () => {
        const dayActivity: DayActivityMap = {
            "2026-03-05": [{ storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null }],
        };
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={dayActivity}
            />
        );
        expect(screen.getByText("NEB-1 feature/x")).toBeInTheDocument();
    });

    it("renders a pr-linked chip as a link", () => {
        const dayActivity: DayActivityMap = {
            "2026-03-05": [
                { storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: "https://github.com/org/repo/pull/1" },
            ],
        };
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={dayActivity}
            />
        );
        const chip = screen.getByText("NEB-1 feature/x");
        expect(chip.tagName).toBe("A");
        expect(chip).toHaveAttribute("href", "https://github.com/org/repo/pull/1");
    });

    it("caps visible chips and folds the rest into a '+N more' chip", () => {
        const dayActivity: DayActivityMap = {
            "2026-03-05": [
                { storyLabel: "A", branchName: "a", status: "WIP", prUrl: null },
                { storyLabel: "B", branchName: "b", status: "WIP", prUrl: null },
                { storyLabel: "C", branchName: "c", status: "WIP", prUrl: null },
                { storyLabel: "D", branchName: "d", status: "WIP", prUrl: null },
                { storyLabel: "E", branchName: "e", status: "WIP", prUrl: null },
            ],
        };
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={dayActivity}
            />
        );
        expect(screen.getByText("+1 more")).toBeInTheDocument();
        expect(screen.queryByText("E e")).not.toBeInTheDocument();
    });

    it("hides activity chips on a holiday and shows holiday styling instead", () => {
        const dayActivity: DayActivityMap = {
            "2026-03-05": [{ storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null }],
        };
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set(["2026-03-05"])}
                dayActivity={dayActivity}
            />
        );
        expect(screen.queryByText("NEB-1 feature/x")).not.toBeInTheDocument();
        const day = screen.getByText("5").closest(".calendar-day") as HTMLElement;
        expect(day).toHaveClass("calendar-day-holiday");
    });

    it("mutes out-of-sprint and weekend days", () => {
        render(
            <SprintActivityCalendar startDate="2026-03-02" endDate="2026-03-16" holidays={new Set()} dayActivity={{}} />
        );
        // March 30 2026 falls outside the 2-16 sprint range but still renders (padding).
        const outOfSprintDay = screen.getByText("30").closest(".calendar-day") as HTMLElement;
        expect(outOfSprintDay).toHaveClass("calendar-day-muted");

        // March 7 2026 is a Saturday within the sprint range.
        const weekendDay = screen.getByText("7").closest(".calendar-day") as HTMLElement;
        expect(weekendDay).toHaveClass("calendar-day-muted");
    });
});
