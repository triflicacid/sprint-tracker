import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import type { SprintSummary, VelocityPoint } from "@shared/types";
import { SprintOverview } from "./SprintOverview";
import { api } from "../../../api/client";
import { exportSectionsAsPdf } from "../../../utils/pdfExport";

function renderSprintOverview(props: ComponentProps<typeof SprintOverview>) {
    return render(
        <MemoryRouter>
            <SprintOverview {...props} />
        </MemoryRouter>
    );
}

vi.mock("../../../api/client", () => ({
    api: {
        getVelocityHistory: vi.fn(),
    },
}));

vi.mock("../../../utils/pdfExport", () => ({
    exportSectionsAsPdf: vi.fn(),
}));

const sprints: SprintSummary[] = [
    {
        id: 1,
        name: "Sprint 1",
        startDate: "2026-03-02",
        endDate: "2026-03-16",
        comment: null,
        project: "Nebula Checkout Platform",
        storyCount: 2,
        prCount: 3,
    },
    {
        id: 2,
        name: "Sprint 2",
        startDate: "2026-03-16",
        endDate: "2026-03-30",
        comment: null,
        project: "Nebula Checkout Platform",
        storyCount: 1,
        prCount: 2,
    },
    {
        id: 3,
        name: "Sprint 3",
        startDate: "2026-03-30",
        endDate: "2026-04-13",
        comment: null,
        project: "Platform Hardening",
        storyCount: 3,
        prCount: 1,
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
    {
        sprintId: 3,
        sprintName: "Sprint 3",
        startDate: "2026-03-30",
        endDate: "2026-04-13",
        completedPoints: 10,
        unpointedDoneStoryCount: 0,
        completedStoryCount: 3,
        completedSubtaskCount: 4,
    },
];

beforeEach(() => {
    vi.mocked(api.getVelocityHistory).mockReset().mockResolvedValue(velocityPoints);
    vi.mocked(exportSectionsAsPdf).mockReset();
});

describe("SprintOverview", () => {
    it("loads the last-5-sprints window by default, anchored on the latest sprint", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");
        expect(api.getVelocityHistory).toHaveBeenCalledWith(1, { mode: "lastN", n: 5 });
    });

    it("switches to all sprints when that toggle is clicked", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        await userEvent.click(screen.getByRole("button", { name: "all sprints" }));
        expect(api.getVelocityHistory).toHaveBeenLastCalledWith(1, { mode: "all" });
    });

    it("switches to a date range when that toggle is clicked", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        await userEvent.click(screen.getByRole("button", { name: "date range" }));
        expect(api.getVelocityHistory).toHaveBeenLastCalledWith(1, {
            mode: "range",
            from: expect.any(String),
            to: expect.any(String),
        });
    });

    it("draws a running-average line alongside the completed-points bars", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        expect(screen.getByText("average velocity")).toBeInTheDocument();
        expect(document.querySelectorAll(".recharts-line")).toHaveLength(1);
        expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(3);
    });

    it("shows the selection's average velocity as a caption below the chart", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        expect(await screen.findByText(/average velocity within the selection is 7\.3/)).toBeInTheDocument();
    });

    it("shows a placeholder when the selection has no sprints", async () => {
        vi.mocked(api.getVelocityHistory).mockResolvedValue([]);
        renderSprintOverview({ sprints, latestSprintId: 1 });
        expect(await screen.findByText("No sprints in this selection yet.")).toBeInTheDocument();
    });

    it("exports all sections together as a combined pdf", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        await userEvent.click(screen.getByRole("button", { name: "export all as pdf" }));

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(2);
        expect(sections[0].title).toBe("Velocity");
        expect(sections[0].lines).toEqual(
            expect.arrayContaining([
                "Showing: last 5 sprints",
                "Sprint 1: 8 pts (1 stories unpointed)",
                "Average velocity: 7.3",
            ])
        );
        expect(sections[1].title).toBe("Projects");
        expect(sections[1].lines).toEqual(
            expect.arrayContaining([
                "Showing: last 5 sprints",
                "Nebula Checkout Platform: 2 sprints (67%)",
                "Platform Hardening: 1 sprint (33%)",
            ])
        );
        expect(filename).toMatch(/^sprint-overview-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("shows a pie chart of projects in the selected sprint range", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        expect(await screen.findByText("Projects")).toBeInTheDocument();
        expect(document.querySelectorAll(".recharts-pie")).toHaveLength(1);
    });

    it("counts sprints by project correctly in the pie chart", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        // The pie chart should show both projects
        expect(await screen.findByText("Projects")).toBeInTheDocument();
        const pieChart = document.querySelector(".recharts-pie");
        expect(pieChart).toBeTruthy();

        // Check the legend shows both projects
        expect(screen.getByText("Nebula Checkout Platform")).toBeInTheDocument();
        expect(screen.getByText("Platform Hardening")).toBeInTheDocument();
    });

    it("handles sprints with no project by grouping them as '(no project)'", async () => {
        const sprintsWithNoProject = [
            ...sprints,
            {
                id: 4,
                name: "Sprint 4",
                startDate: "2026-04-13",
                endDate: "2026-04-27",
                comment: null,
                project: null,
                storyCount: 1,
                prCount: 1,
            },
        ];
        const pointsWithNoProject = [
            ...velocityPoints,
            {
                sprintId: 4,
                sprintName: "Sprint 4",
                startDate: "2026-04-13",
                endDate: "2026-04-27",
                completedPoints: 5,
                unpointedDoneStoryCount: 0,
                completedStoryCount: 1,
                completedSubtaskCount: 2,
            },
        ];
        vi.mocked(api.getVelocityHistory).mockResolvedValue(pointsWithNoProject);

        renderSprintOverview({ sprints: sprintsWithNoProject, latestSprintId: 1 });
        await screen.findByText("completed points");

        // Check the legend shows the "(no project)" entry
        expect(await screen.findByText("(no project)")).toBeInTheDocument();
    });

    it("does not show the project pie chart when no sprints are in the selection", async () => {
        vi.mocked(api.getVelocityHistory).mockResolvedValue([]);
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("No sprints in this selection yet.");

        expect(screen.queryByText("Projects")).not.toBeInTheDocument();
    });

    it("updates the project pie chart when the sprint selection changes", async () => {
        // Start with all 3 sprints
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");
        expect(await screen.findByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("Nebula Checkout Platform")).toBeInTheDocument();
        expect(screen.getByText("Platform Hardening")).toBeInTheDocument();

        // Switch to only showing sprint 3
        vi.mocked(api.getVelocityHistory).mockResolvedValue([velocityPoints[2]]);
        await userEvent.click(screen.getByRole("button", { name: "date range" }));

        // Now only Platform Hardening should show in the legend
        await screen.findByText("Platform Hardening");
        expect(screen.queryByText("Nebula Checkout Platform")).not.toBeInTheDocument();
    });

    it("allows exporting the velocity section independently", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        // Get all export buttons - there should be at least 3 (parent "export all as pdf" + velocity + projects)
        const allButtons = screen.getAllByRole("button");
        // Find the button that's in the Velocity section header (not the collapse button)
        const velocitySection = screen.getByText("Velocity").closest(".collapsible-section");
        const exportButton = velocitySection?.querySelector("button:not(.collapsible-section-trigger)");
        expect(exportButton).toBeTruthy();
        await userEvent.click(exportButton!);

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe("Velocity");
        expect(sections[0].lines).toEqual(
            expect.arrayContaining([
                "Showing: last 5 sprints",
                "Sprint 1: 8 pts (1 stories unpointed)",
                "Average velocity: 7.3",
            ])
        );
        expect(filename).toMatch(/^velocity-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("allows exporting the projects section independently", async () => {
        renderSprintOverview({ sprints, latestSprintId: 1 });
        await screen.findByText("completed points");

        // Find the export button within the Projects section (not the collapse button)
        const projectsSection = screen.getByText("Projects").closest(".collapsible-section");
        const exportButton = projectsSection?.querySelector("button:not(.collapsible-section-trigger)");
        expect(exportButton).toBeTruthy();
        await userEvent.click(exportButton!);

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe("Projects");
        expect(sections[0].lines).toEqual(
            expect.arrayContaining([
                "Showing: last 5 sprints",
                "Nebula Checkout Platform: 2 sprints (67%)",
                "Platform Hardening: 1 sprint (33%)",
            ])
        );
        expect(filename).toMatch(/^projects-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
});

