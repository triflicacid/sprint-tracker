import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SprintListPage } from "#pages/SprintListPage";
import { api } from "#api/client";

vi.mock("#api/client", () => ({
    api: {
        listSprints: vi.fn(),
        listSprintProjects: vi.fn(),
        createSprint: vi.fn(),
    },
}));

beforeEach(() => {
    vi.mocked(api.listSprints).mockReset();
    vi.mocked(api.listSprintProjects).mockReset();
    vi.mocked(api.createSprint).mockReset();
});

function renderPage() {
    return render(
        <MemoryRouter>
            <SprintListPage />
        </MemoryRouter>
    );
}

describe("sprint list page", () => {
    it("lists sprints returned by the api", async () => {
        vi.mocked(api.listSprints).mockResolvedValue([
            { id: 1, name: "Sprint 1", startDate: "2026-01-01", endDate: null, comment: null, project: null, storyCount: 2, prCount: 3 },
        ]);
        vi.mocked(api.listSprintProjects).mockResolvedValue([]);
        renderPage();
        expect(await screen.findByText("Sprint 1")).toBeInTheDocument();
    });

    it("has links to stats, timesheet and transitions", async () => {
        vi.mocked(api.listSprints).mockResolvedValue([]);
        vi.mocked(api.listSprintProjects).mockResolvedValue([]);
        renderPage();
        expect(await screen.findByText("stats")).toHaveAttribute("href", "/stats");
        expect(screen.getByText("timesheet")).toHaveAttribute("href", "/timesheet");
        expect(screen.getByText("transitions")).toHaveAttribute("href", "/transitions");
    });

    it("creates a sprint via the form and reloads the list", async () => {
        vi.mocked(api.listSprints).mockResolvedValue([]);
        vi.mocked(api.listSprintProjects).mockResolvedValue([]);
        vi.mocked(api.createSprint).mockResolvedValue({
            id: 2,
            name: "New Sprint",
            startDate: "2026-02-01",
            endDate: null,
            comment: null,
            project: null,
            storyCount: 0,
            prCount: 0,
        });
        renderPage();

        await userEvent.click(await screen.findByText("new sprint"));
        await userEvent.type(screen.getByPlaceholderText("sprint name"), "New Sprint");
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        await userEvent.type(dateInput, "2026-02-01");
        await userEvent.click(screen.getByText("create"));

        expect(api.createSprint).toHaveBeenCalledWith(
            expect.objectContaining({ name: "New Sprint", startDate: "2026-02-01" })
        );
        expect(api.listSprints).toHaveBeenCalledTimes(2);
    });
});
