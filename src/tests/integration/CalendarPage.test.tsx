import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CalendarPage } from "../../pages/CalendarPage";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({
    api: {
        listTags: vi.fn(),
        getCalendar: vi.fn(),
    },
}));

beforeEach(() => {
    vi.mocked(api.listTags).mockReset();
    vi.mocked(api.getCalendar).mockReset();
    vi.mocked(api.listTags).mockResolvedValue([
        { id: 1, name: "checkout-web", tagType: "repo" },
        { id: 2, name: "urgent", tagType: "custom" },
    ]);
    vi.mocked(api.getCalendar).mockResolvedValue([
        { sprintId: 1, sprintName: "Sprint 1", startDate: "2026-03-02", endDate: "2026-03-16", repos: ["checkout-web"], tags: [] },
    ]);
});

function renderPage() {
    return render(
        <MemoryRouter>
            <CalendarPage />
        </MemoryRouter>
    );
}

describe("CalendarPage", () => {
    it("renders the range calendar with entries from the api", async () => {
        renderPage();
        // the sprint's name repeats at the start of every week row it spans
        expect((await screen.findAllByText("Sprint 1")).length).toBeGreaterThan(0);
    });

    it("splits tags into repo and custom filter dropdowns", async () => {
        renderPage();
        expect(await screen.findByText("repo")).toBeInTheDocument();
        expect(screen.getByText("tag")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "checkout-web" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "urgent" })).toBeInTheDocument();
    });

    it("refetches the calendar with the repo filter when changed", async () => {
        renderPage();
        await screen.findAllByText("Sprint 1");
        const [repoSelect] = screen.getAllByRole("combobox");
        await userEvent.selectOptions(repoSelect, "checkout-web");
        expect(api.getCalendar).toHaveBeenCalledWith({ repo: "checkout-web", tag: undefined });
    });
});
