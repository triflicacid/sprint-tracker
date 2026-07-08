import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { StatusFlowConfig, StoryDetail, Subtask } from "@shared/types";
import { StoryDetailPage } from "../../pages/StoryDetailPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";
import { exportSectionsAsPdf } from "../../utils/pdfExport";

vi.mock("../../api/client", () => ({
    api: {
        getStory: vi.fn(),
        getStatusFlow: vi.fn(),
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
    jiraUrl: "https://nebula.atlassian.net/browse/NEB-1",
    jiraKey: "NEB-1",
    description: "support saved cards",
    jiraTitle: null,
    jiraLabels: [],
    status: "JIRA_ONLY",
    awaitingMoreSubtasks: false,
    storyPoints: null,
    tags: [{ id: 1, name: "payments", tagType: "custom" }],
    prCount: 0,
    subtasks: [],
};

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
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
            createdAt: "2026-01-01",
        });
        renderPage();
        await screen.findByText("support saved cards");

        await userEvent.type(screen.getByPlaceholderText("subtask title"), "new subtask");
        await userEvent.click(screen.getByText("add subtask"));

        expect(api.createSubtask).toHaveBeenCalledWith(1, { title: "new subtask" });
        expect(api.getStory).toHaveBeenCalledTimes(2);
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
                }),
                subtask({ id: 6, title: "wire up client" }),
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

        expect(sections).toHaveLength(3);
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

        // subtask pages are a real drawn table (no flow-diagram screenshot),
        // plus a pr link line up front when the subtask has one.
        expect(sections[1].title).toBe("add endpoint (feature/add-endpoint)");
        expect(sections[1].element).toBeUndefined();
        expect(sections[1].table).toEqual({
            headers: ["date/time", "state", "time in previous"],
            columnWidths: [55, 45, 55],
            rows: [
                [{ text: "2026-01-01 00:00" }, { text: "new", color: [107, 114, 128] }, { text: "-" }],
                [{ text: "2026-01-03 00:00" }, { text: "wip", color: [217, 89, 38] }, { text: "2d 0h 0m" }],
            ],
        });
        expect(sections[1].lines).toEqual(
            expect.arrayContaining([
                { text: "Pull request: https://github.com/acme/repo/pull/7", url: "https://github.com/acme/repo/pull/7" },
                "Total time in each phase:",
            ])
        );

        expect(sections[2].element).toBeUndefined();
        expect(sections[2].table).toBeUndefined();
        expect(sections[2].lines).not.toEqual(expect.arrayContaining([expect.objectContaining({ url: expect.anything() })]));

        expect(sections[2].title).toBe("wire up client");
        expect(sections[2].lines).toEqual(["No status history recorded yet."]);

        expect(filename).toMatch(/^NEB-1-export-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
});
