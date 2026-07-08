import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SprintDetailPage } from "../../pages/SprintDetailPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";
import { downloadTextFile } from "../../utils/download";

vi.mock("../../api/client", () => ({
    api: {
        getSprint: vi.fn(),
        listHolidays: vi.fn(),
        addHoliday: vi.fn(),
        removeHoliday: vi.fn(),
        createStory: vi.fn(),
        updateSprint: vi.fn(),
        exportMarkdown: vi.fn(),
    },
}));

vi.mock("../../utils/download", () => ({
    downloadTextFile: vi.fn(),
}));

const sprint = {
    id: 9,
    name: "Sprint 9",
    startDate: "2026-01-01",
    endDate: "2026-01-15",
    comment: null,
    storyCount: 1,
    prCount: 0,
    stories: [
        {
            id: 1,
            sprintId: 9,
            jiraUrl: "https://x/browse/NEB-1",
            jiraKey: "NEB-1",
            description: "a story",
            jiraTitle: null,
            jiraLabels: [],
            status: "JIRA_ONLY" as const,
            awaitingMoreSubtasks: false,
            storyPoints: null,
            tags: [],
            prCount: 0,
        },
    ],
};

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(downloadTextFile).mockReset();
    vi.mocked(api.getSprint).mockResolvedValue(sprint);
    vi.mocked(api.listHolidays).mockResolvedValue([]);
});

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/sprints/9"]}>
            <ToastProvider>
                <Routes>
                    <Route path="/sprints/:id" element={<SprintDetailPage />} />
                </Routes>
            </ToastProvider>
        </MemoryRouter>
    );
}

describe("SprintDetailPage", () => {
    it("shows loading then the sprint's stories", async () => {
        renderPage();
        expect(screen.getByText("loading...")).toBeInTheDocument();
        expect(await screen.findByText("a story")).toBeInTheDocument();
    });

    it("adds a holiday through the form", async () => {
        vi.mocked(api.addHoliday).mockResolvedValue(undefined);
        renderPage();
        await screen.findByText("a story");

        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        await userEvent.type(dateInput, "2026-01-05");
        await userEvent.click(screen.getByText("add holiday"));

        expect(api.addHoliday).toHaveBeenCalledWith("2026-01-05");
    });

    it("creates a story through the form", async () => {
        vi.mocked(api.createStory).mockResolvedValue({ ...sprint.stories[0], id: 2 });
        renderPage();
        await screen.findByText("a story");

        await userEvent.click(screen.getByText("new story"));
        await userEvent.type(screen.getByPlaceholderText("jira link"), "https://x/browse/NEB-2");
        await userEvent.type(screen.getByPlaceholderText("description"), "another story");
        await userEvent.click(screen.getByText("create"));

        expect(api.createStory).toHaveBeenCalledWith(9, {
            jiraUrl: "https://x/browse/NEB-2",
            description: "another story",
        });
    });

    it("downloads a markdown export for just this sprint when 'export' is clicked", async () => {
        vi.mocked(api.exportMarkdown).mockResolvedValue("# Sprint 9\n");
        renderPage();
        await screen.findByText("a story");

        await userEvent.click(screen.getByText("export"));

        expect(api.exportMarkdown).toHaveBeenCalledWith([9], expect.any(Object));
        expect(downloadTextFile).toHaveBeenCalledWith(expect.stringMatching(/^sprint-export-.*\.md$/), "# Sprint 9\n");
    });

    it("saves an edited comment on blur", async () => {
        vi.mocked(api.updateSprint).mockResolvedValue({ ...sprint, comment: "updated" });
        renderPage();
        await screen.findByText("a story");

        await userEvent.click(screen.getByText("add comment"));
        const textarea = document.querySelector(".comment-edit") as HTMLTextAreaElement;
        await userEvent.type(textarea, "updated");
        textarea.blur();

        expect(api.updateSprint).toHaveBeenCalledWith(9, { comment: "updated" });
    });
});
