import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

function offsetFromToday(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

const sprint = {
    id: 9,
    name: "Sprint 9",
    startDate: "2026-01-01",
    // must stay unlocked (endDate in the future) for the existing tests below.
    endDate: offsetFromToday(180),
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
            isBug: false,
            tags: [],
            prCount: 0,
        },
    ],
};

const lockedSprint = { ...sprint, endDate: "2020-01-10" };

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

    it("adds a holiday through the popover", async () => {
        vi.mocked(api.addHoliday).mockResolvedValue(undefined);
        renderPage();
        await screen.findByText("a story");

        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));
        const januaryGrid = screen.getByText("January 2026").closest(".calendar-month") as HTMLElement;
        await userEvent.click(within(januaryGrid).getByText("5"));

        expect(api.addHoliday).toHaveBeenCalledWith("2026-01-05");
    });

    it("collapses consecutive holiday dates into a single range pill, formatted dd/mm/yyyy with an em dash", async () => {
        vi.mocked(api.listHolidays).mockResolvedValue(["2026-01-12", "2026-01-13", "2026-01-14", "2026-01-20"]);
        renderPage();
        await screen.findByText("a story");

        expect(await screen.findByText("12/01/2026—14/01/2026")).toBeInTheDocument();
        expect(screen.getByText("20/01/2026")).toBeInTheDocument();
        expect(screen.queryByText("2026-01-12")).not.toBeInTheDocument();
    });

    it("allows toggling a holiday well beyond today for an ongoing sprint (no endDate yet)", async () => {
        // startDate is far in the future so this test stays correct
        // regardless of when it actually runs - no need to mock "today".
        const ongoingSprint = { ...sprint, startDate: "2030-01-01", endDate: null };
        vi.mocked(api.getSprint).mockResolvedValue(ongoingSprint);
        vi.mocked(api.addHoliday).mockResolvedValue(undefined);
        renderPage();
        await screen.findByText("a story");

        // an ongoing sprint has no endDate to bound the fetch by - must stay
        // unbounded (not capped at "today"), or a holiday added beyond today
        // would silently vanish from the list on refetch.
        expect(api.listHolidays).toHaveBeenCalledWith("2030-01-01", "9999-12-31");

        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));
        const januaryGrid = screen.getByText("January 2030").closest(".calendar-month") as HTMLElement;
        // 2030-01-10 is a thursday.
        const day = within(januaryGrid).getByText("10").closest(".calendar-day") as HTMLElement;
        expect(day).toHaveClass("calendar-day-clickable");
        expect(day).not.toHaveClass("calendar-day-muted");

        await userEvent.click(day);
        expect(api.addHoliday).toHaveBeenCalledWith("2030-01-10");
    });

    it("hides the holiday popover trigger when locked", async () => {
        vi.mocked(api.getSprint).mockResolvedValue(lockedSprint);
        vi.mocked(api.listHolidays).mockResolvedValue(["2020-01-05"]);
        renderPage();
        await screen.findByText("a story");
        await screen.findByText("05/01/2020");

        expect(screen.queryByRole("button", { name: "edit holidays" })).not.toBeInTheDocument();
    });

    it("shows a lock icon in the title once the sprint has ended", async () => {
        vi.mocked(api.getSprint).mockResolvedValue(lockedSprint);
        renderPage();
        const heading = await screen.findByRole("heading", { name: /Sprint 9/ });
        expect(heading.querySelector("svg.lock-icon")).not.toBeNull();
    });

    it("shows no lock icon while the sprint is still open", async () => {
        renderPage();
        const heading = await screen.findByRole("heading", { name: /Sprint 9/ });
        expect(heading.querySelector("svg.lock-icon")).toBeNull();
    });

    it("removes the new-story button and the empty comment editor once the sprint has ended", async () => {
        vi.mocked(api.getSprint).mockResolvedValue(lockedSprint);
        renderPage();
        await screen.findByText("a story");

        expect(screen.queryByText("new story")).not.toBeInTheDocument();
        expect(screen.queryByText("add comment")).not.toBeInTheDocument();
    });

    it("shows an existing comment as read-only text once the sprint has ended", async () => {
        vi.mocked(api.getSprint).mockResolvedValue({ ...lockedSprint, comment: "wrapped up early" });
        renderPage();
        await screen.findByText("a story");

        await userEvent.click(await screen.findByText("wrapped up early"));
        expect(document.querySelector(".comment-edit")).not.toBeInTheDocument();
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
            isBug: false,
        });
    });

    it("creates a bug story when 'bug' is picked from the story type dropdown", async () => {
        vi.mocked(api.createStory).mockResolvedValue({ ...sprint.stories[0], id: 2, isBug: true });
        renderPage();
        await screen.findByText("a story");

        await userEvent.click(screen.getByText("new story"));
        await userEvent.type(screen.getByPlaceholderText("jira link"), "https://x/browse/NEB-3");
        await userEvent.type(screen.getByPlaceholderText("description"), "a bug report");
        await userEvent.click(screen.getByRole("button", { name: "story" }));
        await userEvent.click(screen.getByRole("option", { name: "bug" }));
        await userEvent.click(screen.getByText("create"));

        expect(api.createStory).toHaveBeenCalledWith(9, {
            jiraUrl: "https://x/browse/NEB-3",
            description: "a bug report",
            isBug: true,
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
