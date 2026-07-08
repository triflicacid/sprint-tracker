import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SprintSummary, VelocityPoint } from "@shared/types";
import { VelocitySection } from "./VelocitySection";
import { api } from "../../api/client";
import { exportSectionsAsPdf } from "../../utils/pdfExport";

vi.mock("../../api/client", () => ({
    api: {
        getVelocityHistory: vi.fn(),
    },
}));

vi.mock("../../utils/pdfExport", () => ({
    exportSectionsAsPdf: vi.fn(),
}));

const sprints: SprintSummary[] = [
    {
        id: 1,
        name: "Sprint 1",
        startDate: "2026-03-02",
        endDate: "2026-03-16",
        comment: null,
        storyCount: 2,
        prCount: 3,
    },
];

const velocityPoints: VelocityPoint[] = [
    {
        sprintId: 1,
        sprintName: "Sprint 1",
        startDate: "2026-03-02",
        endDate: "2026-03-16",
        completedPoints: 8,
        unpointedDoneStoryCount: 1,
        completedStoryCount: 2,
        completedSubtaskCount: 3,
    },
    {
        sprintId: 2,
        sprintName: "Sprint 2",
        startDate: "2026-03-16",
        endDate: "2026-03-30",
        completedPoints: 4,
        unpointedDoneStoryCount: 0,
        completedStoryCount: 1,
        completedSubtaskCount: 2,
    },
];

beforeEach(() => {
    vi.mocked(api.getVelocityHistory).mockReset().mockResolvedValue(velocityPoints);
    vi.mocked(exportSectionsAsPdf).mockReset();
});

describe("VelocitySection", () => {
    it("loads the last-5-sprints window by default, anchored on the latest sprint", async () => {
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        await screen.findByText("completed points");
        expect(api.getVelocityHistory).toHaveBeenCalledWith(1, { mode: "lastN", n: 5 });
    });

    it("switches to all sprints when that toggle is clicked", async () => {
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        await screen.findByText("completed points");

        await userEvent.click(screen.getByRole("button", { name: "all sprints" }));
        expect(api.getVelocityHistory).toHaveBeenLastCalledWith(1, { mode: "all" });
    });

    it("switches to a date range when that toggle is clicked", async () => {
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        await screen.findByText("completed points");

        await userEvent.click(screen.getByRole("button", { name: "date range" }));
        expect(api.getVelocityHistory).toHaveBeenLastCalledWith(1, {
            mode: "range",
            from: expect.any(String),
            to: expect.any(String),
        });
    });

    it("draws a running-average line alongside the completed-points bars", async () => {
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        await screen.findByText("completed points");

        expect(screen.getByText("average velocity")).toBeInTheDocument();
        expect(document.querySelectorAll(".recharts-line")).toHaveLength(1);
        expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(2);
    });

    it("shows the selection's average velocity as a caption below the chart", async () => {
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        expect(await screen.findByText(/average velocity within the selection is 6/)).toBeInTheDocument();
    });

    it("shows a placeholder when the selection has no sprints", async () => {
        vi.mocked(api.getVelocityHistory).mockResolvedValue([]);
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        expect(await screen.findByText("No sprints in this selection yet.")).toBeInTheDocument();
    });

    it("exports its own pdf independent of the page-level export-all", async () => {
        render(<VelocitySection sprints={sprints} latestSprintId={1} />);
        await screen.findByText("completed points");

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe("Velocity");
        expect(sections[0].lines).toEqual(
            expect.arrayContaining(["Sprint 1: 8 pts (1 stories unpointed)", "Average velocity: 6"])
        );
        expect(filename).toMatch(/^velocity-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
});
