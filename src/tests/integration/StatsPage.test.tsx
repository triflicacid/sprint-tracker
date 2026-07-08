import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StatsPage } from "../../pages/StatsPage";
import { api } from "../../api/client";
import { exportSectionsAsPdf } from "../../utils/pdfExport";

vi.mock("../../api/client", () => ({
    api: {
        listSprints: vi.fn(),
        getSprintStats: vi.fn(),
        getComplexityTiming: vi.fn(),
        getDayActivity: vi.fn(),
        getStatusBreakdown: vi.fn(),
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

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.listSprints).mockResolvedValue([sprint]);
    vi.mocked(api.getSprintStats).mockResolvedValue(stats);
    vi.mocked(api.getComplexityTiming).mockResolvedValue(complexity);
    vi.mocked(api.getDayActivity).mockResolvedValue({});
    vi.mocked(api.getStatusBreakdown).mockResolvedValue([{ date: "2026-03-10", counts: { NEW: 1, WIP: 1 } }]);
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

    it("shows start date, end date, and completed status in the summary tiles", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        expect((await screen.findByText("start date")).previousElementSibling).toHaveTextContent("2026-03-02");
        expect(screen.getByText("end date").previousElementSibling).toHaveTextContent("2026-03-16");
        expect(screen.getByText("completed").previousElementSibling).toHaveTextContent("yes");
    });

    it("shows 'ongoing' for end date and completed when the sprint has no end date", async () => {
        vi.mocked(api.listSprints).mockResolvedValue([{ ...sprint, endDate: null }]);
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        expect(screen.getByText("end date").previousElementSibling).toHaveTextContent("ongoing");
        expect(screen.getByText("completed").previousElementSibling).toHaveTextContent("ongoing");
    });

    it("renders the complexity section's rating distribution and per-story summary", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");

        expect(await screen.findByText("Complexity")).toBeInTheDocument();
        expect(screen.getByText("complexity 3").previousElementSibling).toHaveTextContent("1");
        expect(screen.getByText("unrated").previousElementSibling).toHaveTextContent("1");
    });

    it("still lists the average running time in the text below the chart for a complexity rating with only one point", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("Complexity");

        expect(screen.getByText(/Average running time by complexity/)).toHaveTextContent("3: 4 days");
    });

    it("does not draw the average square marker on the chart for a complexity rating with only one point", async () => {
        const { container } = renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("Complexity");
        
        expect(container.querySelectorAll('[fill="#ffffff"]')).toHaveLength(0);
    });

    it("draws the average square marker on the chart for a complexity rating with more than one point", async () => {
        vi.mocked(api.getComplexityTiming).mockResolvedValue({
            points: [
                { subtaskId: 1, storyId: 1, storyLabel: "NEB-1", complexityRating: 3, runningTimeDays: 2 },
                { subtaskId: 2, storyId: 2, storyLabel: "NEB-2", complexityRating: 3, runningTimeDays: 6 },
            ],
            ratingCounts: { 3: 2 },
            unratedCount: 0,
            inProgressRatedCount: 0,
            storyComplexity: [
                { storyId: 1, storyLabel: "NEB-1", totalComplexity: 3 },
                { storyId: 2, storyLabel: "NEB-2", totalComplexity: 3 },
            ],
        });
        const { container } = renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("Complexity");

        expect(screen.getByText(/Average running time by complexity/)).toHaveTextContent("3: 4 days");
        expect(container.querySelectorAll('[fill="#ffffff"]').length).toBeGreaterThan(0);
    });

    it("switches status breakdown granularity via the toggle buttons", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        await userEvent.click(screen.getByRole("button", { name: "stories" }));
        expect(api.getStatusBreakdown).toHaveBeenCalledWith(1, "story");
    });

    it("renders a burndown section driven by the same granularity toggle as status breakdown", async () => {
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

    it("switches the burndown chart to the advanced per-milestone view", async () => {
        const { container } = renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");
        await screen.findByText("Burndown");

        // basic view is the default: one actual line, one ideal line
        expect(container.textContent).toContain("actual");
        expect(container.textContent).toContain("ideal");

        await userEvent.click(screen.getByRole("button", { name: "advanced" }));

        // advanced view: no more "actual" legend, one line per milestone status instead,
        // still alongside the same shared ideal reference line
        expect(container.textContent).not.toContain("actual");
        expect(container.textContent).toContain("ideal");
        expect(container.textContent).toContain("new");
        expect(container.textContent).toContain("testing");
        expect(container.textContent).toContain("uat");
        expect(container.textContent).toContain("done");
    });

    it("renders the sprint's calendar once loaded", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        expect(await screen.findByText("March 2026")).toBeInTheDocument();
    });

    it("toggles a holiday when a calendar day is clicked", async () => {
        vi.mocked(api.addHoliday).mockResolvedValue(undefined);
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("March 2026");

        await userEvent.click(screen.getByText("5", { selector: ".calendar-day-number" }));
        expect(api.addHoliday).toHaveBeenCalledWith("2026-03-05");
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

    it("exports every section as one multi-page pdf via the header button, with charts and written stats", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        await userEvent.click(screen.getByRole("button", { name: "export all as pdf" }));

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(6);

        // summary is text-only; the rest pair a chart/calendar screenshot with
        // written stats underneath.
        expect(sections[0].element).toBeUndefined();
        sections.slice(1).forEach((section) => expect(section.element).toBeInstanceOf(HTMLElement));

        const repoSection = sections[1];
        expect(repoSection.title).toBe("Repo distribution");
        expect(repoSection.lines).toEqual(["checkout-web: 3 PRs (100%)"]);

        const timeSection = sections[2];
        expect(timeSection.lines).toEqual(
            expect.arrayContaining(["a story: 4 days", "Average: 4.0 days across 1 story"])
        );

        const complexitySection = sections[3];
        expect(complexitySection.title).toBe("Complexity");
        expect(complexitySection.lines).toEqual([
            "Complexity 1: 0 subtasks",
            "Complexity 2: 0 subtasks",
            "Complexity 3: 1 subtask (NEB-1), with an average running time of 4 days",
            "Complexity 4: 0 subtasks",
            "Complexity 5: 0 subtasks",
            "Unrated/not done: 1",
        ]);

        const statusSection = sections[4];
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
        expect(sections[4].lines).toEqual([
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
