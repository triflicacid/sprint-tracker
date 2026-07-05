import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { StatusFlowConfig, StoryDetail } from "@shared/types";
import { StoryDetailPage } from "../../pages/StoryDetailPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";

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
    },
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
    tags: [{ id: 1, name: "payments", tagType: "custom" }],
    prCount: 0,
    subtasks: [],
};

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
});

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
});
