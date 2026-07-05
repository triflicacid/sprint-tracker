import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { StatsPage } from "../../pages/StatsPage";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({
    api: {
        listSprints: vi.fn(),
        getSprintStats: vi.fn(),
        getDayActivity: vi.fn(),
        getStatusBreakdown: vi.fn(),
        listHolidays: vi.fn(),
        addHoliday: vi.fn(),
        removeHoliday: vi.fn(),
    },
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
    storyTimeDays: [{ storyId: 1, description: "a story", days: 4 }],
};

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.listSprints).mockResolvedValue([sprint]);
    vi.mocked(api.getSprintStats).mockResolvedValue(stats);
    vi.mocked(api.getDayActivity).mockResolvedValue({});
    vi.mocked(api.getStatusBreakdown).mockResolvedValue([]);
    vi.mocked(api.listHolidays).mockResolvedValue([]);
});

function renderPage() {
    return render(
        <MemoryRouter>
            <StatsPage />
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

    it("switches status breakdown granularity via the toggle buttons", async () => {
        renderPage();
        await userEvent.selectOptions(await screen.findByRole("combobox"), "1");
        await screen.findByText("pull requests");

        await userEvent.click(screen.getByRole("button", { name: "stories" }));
        expect(api.getStatusBreakdown).toHaveBeenCalledWith(1, "story");
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

        await userEvent.click(screen.getByText("5"));
        expect(api.addHoliday).toHaveBeenCalledWith("2026-03-05");
    });
});
