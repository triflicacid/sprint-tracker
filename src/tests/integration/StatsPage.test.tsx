import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StatsPage } from "../../pages/StatsPage";
import { api } from "../../api/client";
import { exportSectionsAsPdf } from "../../utils/pdfExport";

// StatsPage itself only owns cross-cutting state (which sprint is selected,
// granularity/burndown-mode, the pdf-export wiring) and fetches data to hand
// down to the section components under src/components/stats/. Rendering
// details for each section (complexity chart markers, calendar day clicks,
// velocity mode switching, ...) are covered by that section's own colocated
// *.test.tsx - this file is for behaviour that only exists once the sections
// are assembled together on the page.

vi.mock("../../api/client", () => ({
    api: {
        listSprints: vi.fn(),
        getSprintStats: vi.fn(),
        getComplexityTiming: vi.fn(),
        getDayActivity: vi.fn(),
        getStatusBreakdown: vi.fn(),
        getVelocityHistory: vi.fn(),
        listHolidays: vi.fn(),
        addHoliday: vi.fn(),
        removeHoliday: vi.fn(),
    },
}));

vi.mock("../../utils/pdfExport", () => ({
    exportSectionsAsPdf: vi.fn(),
}));

const sprint = {
    id: 1,
    name: "Sprint 1",
    startDate: "2026-03-02",
    endDate: "2026-03-16",
    comment: null,
    storyCount: 2,
    prCount: 3,
};

const stats = {
    sprintId: 1,
    prCount: 3,
    storyCount: 2,
    bugCount: 1,
    repoCounts: [{ repoName: "checkout-web", count: 3, proportion: 1 }],
    storyTimeDays: [{ storyId: 1, storyLabel: "NEB-1", description: "a story", days: 4 }],
};

const complexity = {
    points: [{ subtaskId: 1, storyId: 1, storyLabel: "NEB-1", complexityRating: 3, runningTimeDays: 4 }],
    ratingCounts: { 3: 1 },
    unratedCount: 1,
    inProgressRatedCount: 0,
    storyComplexity: [{ storyId: 1, storyLabel: "NEB-1", totalComplexity: 3 }],
};

const velocityPoints = [
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
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.listSprints).mockResolvedValue([sprint]);
    vi.mocked(api.getSprintStats).mockResolvedValue(stats);
    vi.mocked(api.getComplexityTiming).mockResolvedValue(complexity);
    vi.mocked(api.getDayActivity).mockResolvedValue({});
    vi.mocked(api.getStatusBreakdown).mockResolvedValue([{ date: "2026-03-10", counts: { NEW: 1, WIP: 1 } }]);
    vi.mocked(api.getVelocityHistory).mockResolvedValue(velocityPoints);
    vi.mocked(api.listHolidays).mockResolvedValue([]);
    vi.mocked(exportSectionsAsPdf).mockReset();
});

function renderPage(initialPath: string = "/stats") {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/stats/:sprintId" element={<StatsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe("StatsPage", () => {
    it("loads stats once a sprint is selected", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");

        const prTile = await screen.findByText("pull requests");
        expect(prTile.previousElementSibling).toHaveTextContent("3");
        expect(api.getSprintStats).toHaveBeenCalledWith(1);
        expect(api.getDayActivity).toHaveBeenCalledWith(1);
    });

    it("wires fetched sprint stats and complexity data into their respective sections", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        expect(screen.getByText("Bugs vs stories")).toBeInTheDocument();
        expect(screen.getByText("Repo distribution")).toBeInTheDocument();
        expect(screen.getByText("checkout-web", { exact: false })).toBeInTheDocument();
        expect(screen.getByText("Time per story (days)")).toBeInTheDocument();
        expect(screen.getByText("Complexity")).toBeInTheDocument();
        expect(screen.getByText("complexity 3").previousElementSibling).toHaveTextContent("1");
    });

    it("shows the velocity section anchored on the most recent sprint when no sprint is selected", async () => {
        renderPage();
        expect(await screen.findByText("Velocity")).toBeInTheDocument();
        expect(api.getVelocityHistory).toHaveBeenCalledWith(1, { mode: "lastN", n: 5 });
    });

    it("hides the velocity section once a sprint is selected, showing a numeric velocity tile in the summary instead", async () => {
        renderPage();
        await screen.findByText("Velocity");

        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        expect(screen.queryByText("Velocity")).not.toBeInTheDocument();
        expect(api.getVelocityHistory).toHaveBeenCalledWith(1, { mode: "lastN", n: 1 });
        expect(screen.getByText("velocity (pts)").previousElementSibling).toHaveTextContent("8");
    });

    it("drives both the burndown chart and status breakdown from the same granularity toggle", async () => {
        const { container } = renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        expect(await screen.findByText("Burndown")).toBeInTheDocument();
        expect(container.textContent).toContain("actual");
        expect(container.textContent).toContain("ideal");

        // there is only one toggle now - it drives both the burndown chart and status breakdown
        expect(screen.getAllByRole("button", { name: "stories" })).toHaveLength(1);
        await userEvent.click(screen.getByRole("button", { name: "stories" }));
        expect(api.getStatusBreakdown).toHaveBeenCalledWith(1, "story");
    });

    it("renders the sprint's calendar once loaded", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        expect(await screen.findByText("March 2026")).toBeInTheDocument();
    });

    it("toggles a holiday when a calendar day is clicked", async () => {
        // sprint's endDate ("2026-03-16") must still be in the future for its calendar to be unlocked/interactive.
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date("2026-03-10T00:00:00Z"));
        try {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderPage();
            await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
            await screen.findByText("March 2026");

            await userEvent.click(screen.getByText("5", { selector: ".calendar-day-number" }));
            expect(api.addHoliday).toHaveBeenCalledWith("2026-03-05");
        } finally {
            vi.useRealTimers();
        }
    });

    it("exports a single section as a pdf with real written stats when its own export button is clicked", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        const exportButtons = screen.getAllByRole("button", { name: "export pdf" });
        await userEvent.click(exportButtons[0]);

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toMatch(/^Summary/);
        expect(sections[0].element).toBeUndefined();
        expect(sections[0].lines).toEqual(
            expect.arrayContaining(["Pull requests: 3", "Stories: 2", "Repos touched: 1"])
        );
        expect(filename).toMatch(/^sprint-stats-summary-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("exports the burndown section as a pdf with both basic and advanced charts side by side", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");
        await screen.findByText("Burndown");

        // Summary, Bugs vs stories, Repo distribution, Time per story, Complexity, Burndown, ...
        const exportButtons = screen.getAllByRole("button", { name: "export pdf" });
        await userEvent.click(exportButtons[5]);

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe("Burndown");

        // the exported element is the off-screen container with both charts,
        // independent of which one the on-screen toggle is currently showing.
        const exportContainer = within(screen.getByTestId("burndown-chart-export"));
        expect(sections[0].element).toBe(screen.getByTestId("burndown-chart-export").firstElementChild);
        expect(exportContainer.getByText("Basic")).toBeInTheDocument();
        expect(exportContainer.getByText("Advanced")).toBeInTheDocument();

        expect(filename).toMatch(/^sprint-stats-burndown-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("exports every section as one multi-page pdf via the header button, with charts and written stats", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        await userEvent.click(screen.getByRole("button", { name: "export all as pdf" }));

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(8);

        // summary is text-only; the rest pair a chart/calendar screenshot with
        // written stats underneath.
        expect(sections[0].element).toBeUndefined();
        sections.slice(1).forEach((section) => expect(section.element).toBeInstanceOf(HTMLElement));

        const summarySection = sections[0];
        expect(summarySection.lines).toContain("Velocity: 8 pts (1 stories unpointed)");

        const bugStorySection = sections[1];
        expect(bugStorySection.title).toBe("Bugs vs stories");
        expect(bugStorySection.lines).toEqual(["Stories: 1 (50%)", "Bugs: 1 (50%)"]);

        const repoSection = sections[2];
        expect(repoSection.title).toBe("Repo distribution");
        expect(repoSection.lines).toEqual(["checkout-web: 3 PRs (100%)"]);

        const timeSection = sections[3];
        expect(timeSection.lines).toEqual(
            expect.arrayContaining(["a story: 4 days", "Average: 4.0 days across 1 story"])
        );

        const complexitySection = sections[4];
        expect(complexitySection.title).toBe("Complexity");
        expect(complexitySection.lines).toEqual([
            "Complexity 1: 0 subtasks",
            "Complexity 2: 0 subtasks",
            "Complexity 3: 1 subtask (NEB-1), with an average running time of 4 days",
            "Complexity 4: 0 subtasks",
            "Complexity 5: 0 subtasks",
            "Unrated/not done: 1",
        ]);

        const burndownSection = sections[5];
        expect(burndownSection.title).toBe("Burndown");
        expect(burndownSection.lines).toEqual([
            "2026-03-10: 2 remaining (ideal 0)",
            "Milestones remaining (2026-03-10): new: 0, testing: 2, uat: 2, done: 2",
        ]);

        const statusSection = sections[6];
        expect(statusSection.lines).toEqual(["2026-03-10: new: 1, wip: 1"]);

        expect(filename).toMatch(/^sprint-stats-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("describes the status breakdown as a start-vs-end comparison when it spans more than one day", async () => {
        vi.mocked(api.getStatusBreakdown).mockResolvedValue([
            { date: "2026-03-02", counts: { NEW: 2 } },
            { date: "2026-03-08", counts: { NEW: 1, WIP: 1 } },
            { date: "2026-03-16", counts: { WIP: 1, DONE: 1 } },
        ]);
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        await userEvent.click(screen.getByRole("button", { name: "export all as pdf" }));

        const [sections] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections[6].lines).toEqual([
            "Start (2026-03-02): new: 2",
            "End (2026-03-16): wip: 1, done: 1",
        ]);
    });

    it("does not show the header export-all button until a sprint is selected", () => {
        renderPage();
        expect(screen.queryByRole("button", { name: "export all as pdf" })).not.toBeInTheDocument();
    });

    it("pre-selects the sprint from a /stats/:sprintId deep link", async () => {
        renderPage("/stats/1");

        const prTile = await screen.findByText("pull requests");
        expect(prTile.previousElementSibling).toHaveTextContent("3");
        expect(api.getSprintStats).toHaveBeenCalledWith(1);
        expect(screen.getByRole("combobox")).toHaveValue("1");
    });
});
