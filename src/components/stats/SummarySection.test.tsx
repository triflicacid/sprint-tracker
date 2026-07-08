import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { SprintStats, SprintSummary, VelocityPoint } from "@shared/types";
import { SummarySection } from "./SummarySection";

const sprint: SprintSummary = {
    id: 1,
    name: "Sprint 1",
    startDate: "2026-03-02",
    endDate: "2026-03-16",
    comment: null,
    storyCount: 2,
    prCount: 3,
};

const stats: SprintStats = {
    sprintId: 1,
    prCount: 3,
    storyCount: 2,
    repoCounts: [{ repoName: "checkout-web", count: 3, proportion: 1 }],
    storyTimeDays: [{ storyId: 1, storyLabel: "NEB-1", description: "a story", days: 4 }],
};

const velocitySummary: VelocityPoint = {
    sprintId: 1,
    sprintName: "Sprint 1",
    startDate: "2026-03-02",
    endDate: "2026-03-16",
    completedPoints: 8,
    unpointedDoneStoryCount: 1,
    completedStoryCount: 2,
    completedSubtaskCount: 3,
};

function renderSection(overrides: Partial<ComponentProps<typeof SummarySection>> = {}) {
    return render(
        <SummarySection
            stats={stats}
            velocitySummary={velocitySummary}
            totalWeekdays={11}
            holidayWeekdays={1}
            selectedSprint={sprint}
            isCompleted
            onExport={vi.fn()}
            loading={false}
            {...overrides}
        />
    );
}

describe("SummarySection", () => {
    it("shows the headline stat tiles", () => {
        renderSection();
        expect(screen.getByText("pull requests").previousElementSibling).toHaveTextContent("3");
        expect(screen.getByText("stories").previousElementSibling).toHaveTextContent("2");
        expect(screen.getByText("velocity (pts)").previousElementSibling).toHaveTextContent("8");
        expect(screen.getByText("repos touched").previousElementSibling).toHaveTextContent("1");
        expect(screen.getByText("sprint days (excl. weekends)").previousElementSibling).toHaveTextContent("11");
        expect(screen.getByText("holidays").previousElementSibling).toHaveTextContent("1");
    });

    it("shows start date, end date, and completed status", () => {
        renderSection();
        expect(screen.getByText("start date").previousElementSibling).toHaveTextContent("2026-03-02");
        expect(screen.getByText("end date").previousElementSibling).toHaveTextContent("2026-03-16");
        expect(screen.getByText("completed").previousElementSibling).toHaveTextContent("yes");
    });

    it("shows 'ongoing' for end date and completed when the sprint has no end date", () => {
        renderSection({ selectedSprint: { ...sprint, endDate: null }, isCompleted: false });
        expect(screen.getByText("end date").previousElementSibling).toHaveTextContent("ongoing");
        expect(screen.getByText("completed").previousElementSibling).toHaveTextContent("ongoing");
    });

    it("shows 0 for velocity when no velocity summary is available yet", () => {
        renderSection({ velocitySummary: null });
        expect(screen.getByText("velocity (pts)").previousElementSibling).toHaveTextContent("0");
    });

    it("wires up the export button", async () => {
        const onExport = vi.fn();
        renderSection({ onExport });
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
    });
});
