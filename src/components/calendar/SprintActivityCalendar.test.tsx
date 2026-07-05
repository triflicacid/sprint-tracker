import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DayActivityMap } from "@shared/types";
import { SprintActivityCalendar } from "./SprintActivityCalendar";

describe("SprintActivityCalendar", () => {
    it("renders a month header for the sprint's range", () => {
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={vi.fn()}
            />
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
                onToggleHoliday={vi.fn()}
            />
        );
        expect(screen.getByText("NEB-1 feature/x")).toBeInTheDocument();
    });

    it("renders a pr-linked chip as a link, and clicking it does not toggle the holiday", async () => {
        const onToggleHoliday = vi.fn();
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
                onToggleHoliday={onToggleHoliday}
            />
        );
        const chip = screen.getByText("NEB-1 feature/x");
        expect(chip.tagName).toBe("A");
        expect(chip).toHaveAttribute("href", "https://github.com/org/repo/pull/1");
        await userEvent.click(chip);
        expect(onToggleHoliday).not.toHaveBeenCalled();
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
                onToggleHoliday={vi.fn()}
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
                onToggleHoliday={vi.fn()}
            />
        );
        expect(screen.queryByText("NEB-1 feature/x")).not.toBeInTheDocument();
    });

    it("toggles a holiday when an in-sprint weekday is clicked", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={onToggleHoliday}
            />
        );
        await userEvent.click(screen.getByText("5"));
        expect(onToggleHoliday).toHaveBeenCalledWith("2026-03-05");
    });

    it("does not toggle a holiday for an out-of-sprint day", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <SprintActivityCalendar
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={onToggleHoliday}
            />
        );
        // March 30 falls outside the 2-16 sprint range but still renders (padding)
        await userEvent.click(screen.getByText("30"));
        expect(onToggleHoliday).not.toHaveBeenCalled();
    });
});
