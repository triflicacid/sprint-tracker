import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { StatusFlowConfig, StoryDetail, Subtask, SubtaskTypeEntry } from "@shared/types";
import { StoryDetailPage } from "../../pages/StoryDetailPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";
import { exportSectionsAsPdf } from "../../utils/pdfExport";

vi.mock("../../api/client", () => ({
    api: {
        getStory: vi.fn(),
        getStatusFlow: vi.fn(),
        getSubtaskTypes: vi.fn(),
        updateStory: vi.fn(),
        createSubtask: vi.fn(),
        updateSubtask: vi.fn(),
        addStoryTag: vi.fn(),
        removeStoryTag: vi.fn(),
        getJiraInfo: vi.fn(),
        getSubtaskHistory: vi.fn(),
    },
}));

vi.mock("../../utils/pdfExport", () => ({
    exportSectionsAsPdf: vi.fn(),
}));

const flow: StatusFlowConfig = {
    states: [{ id: "NEW", label: "new", rank: 0, color: "#6b7280", description: "" }],
    transitions: [{ from: "NEW", to: [] }],
};

const story: StoryDetail = {
    id: 1,
    sprintId: 9,
    sprintEndDate: null,
    jiraUrl: "https://nebula.atlassian.net/browse/NEB-1",
    jiraKey: "NEB-1",
    description: "support saved cards",
    jiraTitle: null,
    jiraLabels: [],
    status: "JIRA_ONLY",
    awaitingMoreSubtasks: false,
    storyPoints: null,
    isBug: false,
    tags: [{ id: 1, name: "payments", tagType: "custom" }],
    prCount: 0,
    subtasks: [],
};

const subtaskTypes: SubtaskTypeEntry[] = [
    { shortName: "unknown", fullName: "Unknown", description: "No type assigned.", selectable: false },
    { shortName: "feature", fullName: "Feature", description: "New user-facing functionality.", tier: "basic" },
    { shortName: "bugfix", fullName: "Bugfix", description: "Fixes broken behavior.", tier: "basic" },
    { shortName: "spike", fullName: "Spike", description: "Investigation.", tier: "basic" },
];

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
    vi.mocked(api.getSubtaskTypes).mockResolvedValue(subtaskTypes);
    vi.mocked(exportSectionsAsPdf).mockReset();
});

function subtask(overrides: Partial<Subtask> & { id: number; title: string }): Subtask {
    return {
        storyId: 1,
        comment: null,
        branchName: "(unknown)",
        status: "NEW",
        url: null,
        repoName: null,
        complexityRating: null,
        releaseVersion: null,
        type: "unknown",
        createdAt: "2026-01-01",
        ...overrides,
    };
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/stories/1"]}>
            <ToastProvider>
                <Routes>
                    <Route path="/stories/:id" element={<StoryDetailPage />} />
                </Routes>
            </ToastProvider>
        </MemoryRouter>
    );
}

describe("StoryDetailPage", () => {
    it("shows loading then the story once fetched", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        renderPage();
        expect(screen.getByText("loading...")).toBeInTheDocument();
        expect(await screen.findByText("support saved cards")).toBeInTheDocument();
        expect(screen.getByText("NEB-1")).toHaveAttribute("href", story.jiraUrl);
    });

    it("shows a lock icon in the title once the parent sprint has ended", async () => {
        vi.mocked(api.getStory).mockResolvedValue({ ...story, sprintEndDate: "2020-01-10" });
        renderPage();
        const heading = await screen.findByRole("heading", { name: /support saved cards/ });
        expect(heading.querySelector("svg.lock-icon")).not.toBeNull();
    });

    it("shows no lock icon while the parent sprint is still open", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        renderPage();
        const heading = await screen.findByRole("heading", { name: /support saved cards/ });
        expect(heading.querySelector("svg.lock-icon")).toBeNull();
    });

    it("shows the story icon in the title for a regular story", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        renderPage();
        const heading = await screen.findByRole("heading", { name: /support saved cards/ });
        expect(heading.querySelector("svg.story-type-icon title")?.textContent).toBe("story");
    });

    it("shows the bug icon in the title for a story flagged as a bug", async () => {
        vi.mocked(api.getStory).mockResolvedValue({ ...story, isBug: true });
        renderPage();
        const heading = await screen.findByRole("heading", { name: /support saved cards/ });
        expect(heading.querySelector("svg.story-type-icon title")?.textContent).toBe("bug");
    });

    it("removes story-level mutating controls once the parent sprint has ended", async () => {
        vi.mocked(api.getStory).mockResolvedValue({ ...story, sprintEndDate: "2020-01-10" });
        renderPage();
        await screen.findByText("support saved cards");

        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText("add tag")).not.toBeInTheDocument();
        expect(screen.queryByText("x")).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText("subtask title")).not.toBeInTheDocument();
        expect(screen.queryByText("add subtask")).not.toBeInTheDocument();
        expect(screen.queryByText("refresh from jira")).not.toBeInTheDocument();
        expect(screen.getByText(/story points: -/)).toBeInTheDocument();
    });

    it("leaves story-level controls in place while the parent sprint is still open", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        renderPage();
        await screen.findByText("support saved cards");

        expect(screen.getByRole("checkbox")).toBeEnabled();
        expect(screen.getByRole("combobox")).toBeEnabled();
        expect(screen.getByPlaceholderText("add tag")).toBeEnabled();
        expect(screen.getByText("x")).toBeEnabled();
        expect(screen.getByPlaceholderText("subtask title")).toBeEnabled();
        expect(screen.getByText("add subtask")).toBeEnabled();
        expect(screen.getByText("refresh from jira")).toBeEnabled();
    });

    it("renders every subtask via SubtaskRow", async () => {
        vi.mocked(api.getStory).mockResolvedValue({
            ...story,
            subtasks: [
                {
                    id: 5,
                    storyId: 1,
                    title: "add endpoint",
                    comment: null,
                    branchName: "(unknown)",
                    status: "NEW",
                    url: null,
                    repoName: null,
                    complexityRating: null,
                    releaseVersion: null,
                    type: "feature",
                    createdAt: "2026-01-01",
                },
            ],
        });
        renderPage();
        expect(await screen.findByText("add endpoint")).toBeInTheDocument();
    });

    it("adds a subtask through the form and reloads the story", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.createSubtask).mockResolvedValue({
            id: 1,
            storyId: 1,
            title: "new subtask",
            comment: null,
            branchName: "(unknown)",
            status: "NEW",
            url: null,
            repoName: null,
            complexityRating: null,
            releaseVersion: null,
            type: "feature",
            createdAt: "2026-01-01",
        });
        renderPage();
        await screen.findByText("support saved cards");

        await userEvent.type(screen.getByPlaceholderText("subtask title"), "new subtask");
        await userEvent.click(screen.getByText("add subtask"));

        expect(api.createSubtask).toHaveBeenCalledWith(1, { title: "new subtask", type: "feature" });
        expect(api.getStory).toHaveBeenCalledTimes(2);
    });

    it("shows a type selector next to the subtask title field", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        renderPage();
        await screen.findByText("support saved cards");
        // The SubtaskTypeSelect trigger shows the current selection
        expect(screen.getByRole("button", { name: "Feature" })).toBeInTheDocument();
    });

    it("allows changing the type before adding a subtask", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.createSubtask).mockResolvedValue(subtask({ id: 10, title: "spike work", type: "spike" }));
        renderPage();
        await screen.findByText("support saved cards");

        // open the type select and pick spike
        await userEvent.click(screen.getByRole("button", { name: "Feature" }));
        await userEvent.click(screen.getByRole("option", { name: "Spike" }));

        await userEvent.type(screen.getByPlaceholderText("subtask title"), "spike work");
        await userEvent.click(screen.getByText("add subtask"));

        expect(api.createSubtask).toHaveBeenCalledWith(1, { title: "spike work", type: "spike" });
    });

    it("hides the type select and subtask form when the parent sprint has ended", async () => {
        vi.mocked(api.getStory).mockResolvedValue({ ...story, sprintEndDate: "2020-01-10" });
        renderPage();
        await screen.findByText("support saved cards");

        expect(screen.queryByPlaceholderText("subtask title")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Feature" })).not.toBeInTheDocument();
    });

    it("submits via Enter key in the title field, passing the selected type", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.createSubtask).mockResolvedValue(subtask({ id: 11, title: "quick add", type: "feature" }));
        renderPage();
        await screen.findByText("support saved cards");

        await userEvent.type(screen.getByPlaceholderText("subtask title"), "quick add{Enter}");

        expect(api.createSubtask).toHaveBeenCalledWith(1, { title: "quick add", type: "feature" });
    });

    it("adds a tag through the form", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.addStoryTag).mockResolvedValue({ id: 2, name: "urgent", tagType: "custom" });
        renderPage();
        await screen.findByText("support saved cards");

        await userEvent.type(screen.getByPlaceholderText("add tag"), "urgent{enter}");
        expect(api.addStoryTag).toHaveBeenCalledWith(1, "urgent");
    });

    it("removes a tag when its x button is clicked", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        renderPage();
        await screen.findByText("payments");
        await userEvent.click(screen.getByText("x"));
        expect(api.removeStoryTag).toHaveBeenCalledWith(1, 1);
    });

    it("refreshes from jira when the jira key is present", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.getJiraInfo).mockResolvedValue({ key: "NEB-1", title: "x", labels: [] });
        renderPage();
        await userEvent.click(await screen.findByText("refresh from jira"));
        expect(api.getJiraInfo).toHaveBeenCalledWith("NEB-1", 1);
    });

    it("toggles awaitingMoreSubtasks via the checkbox", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.updateStory).mockResolvedValue({ ...story, awaitingMoreSubtasks: true });
        renderPage();
        await screen.findByText("support saved cards");
        await userEvent.click(screen.getByRole("checkbox"));
        expect(api.updateStory).toHaveBeenCalledWith(1, { awaitingMoreSubtasks: true });
    });

    it("updates storyPoints via the select", async () => {
        vi.mocked(api.getStory).mockResolvedValue(story);
        vi.mocked(api.updateStory).mockResolvedValue({ ...story, storyPoints: 5 });
        renderPage();
        await screen.findByText("support saved cards");
        await userEvent.selectOptions(screen.getByRole("combobox"), "5");
        expect(api.updateStory).toHaveBeenCalledWith(1, { storyPoints: 5 });
    });

    it("exports a pdf with one section per subtask plus a summary section, fetching each subtask's history first", async () => {
        vi.mocked(api.getStory).mockResolvedValue({
            ...story,
            subtasks: [
                subtask({
                    id: 5,
                    title: "add endpoint",
                    branchName: "feature/add-endpoint",
                    url: "https://github.com/acme/repo/pull/7",
                    type: "feature",
                }),
                subtask({ id: 6, title: "wire up client", type: "bugfix" }),
            ],
        });
        vi.mocked(api.getSubtaskHistory).mockImplementation((id) =>
            Promise.resolve(
                id === 5
                    ? [
                          { id: 1, entityType: "subtask", entityId: 5, status: "NEW", releaseVersion: null, changedAt: "2026-01-01T00:00:00.000Z" },
                          { id: 2, entityType: "subtask", entityId: 5, status: "WIP", releaseVersion: null, changedAt: "2026-01-03T00:00:00.000Z" },
                      ]
                    : []
            )
        );

        renderPage();
        await screen.findByText("support saved cards");
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));

        expect(api.getSubtaskHistory).toHaveBeenCalledWith(5);
        expect(api.getSubtaskHistory).toHaveBeenCalledWith(6);

        await vi.waitFor(() => expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1));
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];

        // summary + subtask-category breakdown + 2 subtask pages = 4
        expect(sections).toHaveLength(4);
        expect(sections[0].title).toBe("support saved cards");
        expect(sections[0].lines).toEqual(
            expect.arrayContaining([
                { text: "Jira: NEB-1", url: story.jiraUrl },
                "Subtasks: 2",
                "Pull requests: 0",
                "Tags: payments",
            ])
        );
        expect(sections[0].element).toBeInstanceOf(HTMLElement);

        // subtask category breakdown section
        expect(sections[1].title).toBe("Subtask category breakdown");
        expect(sections[1].table).toBeDefined();
        expect(sections[1].table?.headers).toEqual(["", "count", "%"]);

        // subtask pages
        expect(sections[2].title).toBe("add endpoint (feature/add-endpoint)");
        expect(sections[2].element).toBeUndefined();
        expect(sections[2].table).toEqual({
            headers: ["date/time", "state", "time in previous"],
            columnWidths: [55, 45, 55],
            rows: [
                [{ text: "2026-01-01 00:00" }, { text: "new", color: [107, 114, 128] }, { text: "-" }],
                [{ text: "2026-01-03 00:00" }, { text: "wip", color: [217, 89, 38] }, { text: "2d 0h 0m" }],
            ],
        });

        expect(sections[3].title).toBe("wire up client");
        expect(sections[3].lines).toEqual(["No status history recorded yet."]);

        expect(filename).toMatch(/^NEB-1-export-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
});
