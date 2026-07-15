import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import type { SprintStats, SprintSummary, VelocityPoint } from "@shared/types";
import { SummarySection, type SummarySectionHandle } from "./SummarySection";
import { api } from "../../api/client";
import { deferred } from "../../testUtils/deferred";

vi.mock("../../api/client", () => ({
    api: {
        getVelocityHistory: vi.fn(),
    },
}));

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
    bugCount: 1,
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

beforeEach(() => {
    vi.mocked(api.getVelocityHistory).mockReset().mockResolvedValue([velocitySummary]);
});

function renderSection(overrides: Partial<ComponentProps<typeof SummarySection>> = {}) {
    return render(
        <SummarySection
            sprintId={1}
            stats={stats}
            totalWeekdays={11}
            holidayWeekdays={1}
            selectedSprint={sprint}
            sprintEndDate={sprint.endDate!}
            isCompleted
            onExport={vi.fn()}
            {...overrides}
        />
    );
}

describe("SummarySection", () => {
    it("fetches this sprint's own velocity figure and shows the headline stat tiles", async () => {
        renderSection();
        await screen.findByText(/^8$/);
        expect(api.getVelocityHistory).toHaveBeenCalledWith(1, { mode: "lastN", n: 1 });
        expect(screen.getByText("pull requests").previousElementSibling).toHaveTextContent("3");
        expect(screen.getByText("stories").previousElementSibling).toHaveTextContent("2");
        expect(screen.getByText("velocity (pts)").previousElementSibling).toHaveTextContent("8");
        expect(screen.getByText("repos touched").previousElementSibling).toHaveTextContent("1");
        expect(screen.getByText("sprint days (excl. weekends)").previousElementSibling).toHaveTextContent("11");
        expect(screen.getByText("holidays").previousElementSibling).toHaveTextContent("1");
    });

    it("refetches when the sprintId prop changes", async () => {
        const { rerender } = renderSection();
        await screen.findByText(/^8$/);

        rerender(
            <SummarySection
                sprintId={2}
                stats={stats}
                totalWeekdays={11}
                holidayWeekdays={1}
                selectedSprint={sprint}
                sprintEndDate={sprint.endDate!}
                isCompleted
                onExport={vi.fn()}
            />
        );
        expect(api.getVelocityHistory).toHaveBeenLastCalledWith(2, { mode: "lastN", n: 1 });
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

    it("shows 0 for velocity while no velocity summary has resolved yet", () => {
        vi.mocked(api.getVelocityHistory).mockReturnValue(new Promise(() => {}));
        renderSection();
        expect(screen.getByText("velocity (pts)").previousElementSibling).toHaveTextContent("0");
    });

    it("exposes the Summary pdf section (text-only, no chart dom node) via the imperative handle", async () => {
        const ref = createRef<SummarySectionHandle>();
        renderSection({ ref });
        await screen.findByText(/^8$/);

        const section = ref.current!.getReportSection();
        expect(section.title).toBe("Summary - Sprint 1");
        expect(section.element).toBeUndefined();
        expect(section.lines).toEqual(
            expect.arrayContaining(["Pull requests: 3", "Stories: 2", "Velocity: 8 pts (1 stories unpointed)"])
        );
    });

    it("wires up the export button, owning its own loading state while the export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        renderSection({ onExport });
        await screen.findByText(/^8$/);

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
