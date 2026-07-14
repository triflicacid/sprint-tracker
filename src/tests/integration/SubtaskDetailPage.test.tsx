import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { StatusFlowConfig, StoryDetail, Subtask } from "@shared/types";
import { SubtaskDetailPage } from "../../pages/SubtaskDetailPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";
import { exportSectionsAsPdf } from "../../utils/pdfExport";

vi.mock("../../api/client", () => ({
    api: {
        getSubtask: vi.fn(),
        getSubtaskHistory: vi.fn(),
        getStatusFlow: vi.fn(),
        updateSubtask: vi.fn(),
        getStory: vi.fn(),
    },
}));

vi.mock("../../utils/pdfExport", () => ({
    exportSectionsAsPdf: vi.fn(),
}));

const flow: StatusFlowConfig = {
    states: [
        { id: "NEW", label: "new", rank: 0, color: "#6b7280", description: "not started" },
        { id: "DONE", label: "done", rank: 1, color: "#008300", description: "finished" },
    ],
    transitions: [{ from: "NEW", to: ["DONE"] }],
};

const subtask: Subtask = {
    id: 5,
    storyId: 1,
    title: "add saved card list endpoint",
    comment: null,
    branchName: "feature/x",
    status: "DONE",
    url: "https://github.com/org/repo/pull/1",
    repoName: "repo",
    complexityRating: null,
    releaseVersion: null,
    createdAt: "2026-01-01",
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
    status: "WORK_REMAINING",
    awaitingMoreSubtasks: false,
    storyPoints: null,
    tags: [],
    prCount: 1,
    subtasks: [
        { ...subtask, id: 3, title: "earlier subtask" },
        subtask,
    ],
};

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
    vi.mocked(api.getSubtaskHistory).mockResolvedValue([]);
    vi.mocked(api.getStory).mockResolvedValue(story);
    vi.mocked(exportSectionsAsPdf).mockReset();
});

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/subtasks/5"]}>
            <ToastProvider>
                <Routes>
                    <Route path="/subtasks/:id" element={<SubtaskDetailPage />} />
                    <Route path="/stories/:id" element={<div>story page</div>} />
                </Routes>
            </ToastProvider>
        </MemoryRouter>
    );
}

describe("SubtaskDetailPage", () => {
    it("shows loading then the subtask's title, row, flow diagram and calendar", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        renderPage();
        expect(screen.getByText("loading...")).toBeInTheDocument();

        expect(await screen.findByRole("heading", { name: "add saved card list endpoint" })).toBeInTheDocument();
        expect(screen.getByText("Flow")).toBeInTheDocument();
        expect(screen.getByText("Activity calendar")).toBeInTheDocument();
    });

    it("shows a lock icon in the title once the parent sprint has ended", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        vi.mocked(api.getStory).mockResolvedValue({ ...story, sprintEndDate: "2020-01-10" });
        renderPage();
        const heading = await screen.findByRole("heading", { name: /add saved card list endpoint/ });
        await vi.waitFor(() => expect(heading.querySelector("svg.lock-icon")).not.toBeNull());
    });

    it("shows no lock icon while the parent sprint is still open", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        renderPage();
        const heading = await screen.findByRole("heading", { name: /add saved card list endpoint/ });
        await vi.waitFor(() => expect(api.getStory).toHaveBeenCalled());
        expect(heading.querySelector("svg.lock-icon")).toBeNull();
    });

    it("disables the comment editor and complexity select once the parent sprint has ended", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        vi.mocked(api.getStory).mockResolvedValue({ ...story, sprintEndDate: "2020-01-10" });
        renderPage();
        await screen.findByRole("heading", { name: "add saved card list endpoint" });

        await vi.waitFor(() => expect(screen.getByRole("combobox")).toBeDisabled());
        await userEvent.click(screen.getByText("add comment"));
        expect(document.querySelector(".comment-edit")).not.toBeInTheDocument();
    });

    it("links back to the parent story", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        renderPage();
        expect(await screen.findByText("back to story")).toHaveAttribute("href", "/stories/1");
    });

    it("fetches both the subtask and its history in parallel", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        renderPage();
        await screen.findByRole("heading", { name: "add saved card list endpoint" });
        expect(api.getSubtask).toHaveBeenCalledWith(5);
        expect(api.getSubtaskHistory).toHaveBeenCalledWith(5);
    });

    it("shows a prompt to add a comment when none is set", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        renderPage();
        expect(await screen.findByText("add comment")).toBeInTheDocument();
    });

    it("shows the existing comment when one is set", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue({ ...subtask, comment: "waiting on infra team" });
        renderPage();
        expect(await screen.findByText("waiting on infra team")).toBeInTheDocument();
    });

    it("turns into a textarea on click and saves the edit on blur", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue({ ...subtask, comment: "old note" });
        vi.mocked(api.updateSubtask).mockResolvedValue({ ...subtask, comment: "old noteupdated" });
        renderPage();

        await userEvent.click(await screen.findByText("old note"));
        const textarea = document.querySelector(".comment-edit") as HTMLTextAreaElement;
        expect(textarea).toHaveValue("old note");
        await userEvent.type(textarea, "updated");
        textarea.blur();

        expect(api.updateSubtask).toHaveBeenCalledWith(5, { comment: "old noteupdated" });
    });

    it("does not show the comment inside the page heading", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue({ ...subtask, comment: "internal note" });
        renderPage();
        await screen.findByText("internal note");
        expect(screen.queryByRole("heading", { name: "internal note" })).not.toBeInTheDocument();
    });

    it("shows the comment below the subtask tile", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue({ ...subtask, comment: "internal note" });
        renderPage();
        const comment = await screen.findByText("internal note");
        const pageHeader = document.querySelector(".page-header") as HTMLElement;
        const tile = document.querySelector(".subtask-row") as HTMLElement;

        expect(pageHeader.contains(comment)).toBe(false);
        expect(tile.compareDocumentPosition(comment) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("lists every transition in the table, including several on the same day", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        vi.mocked(api.getSubtaskHistory).mockResolvedValue([
            { id: 1, entityType: "subtask", entityId: 5, status: "NEW", releaseVersion: null, changedAt: "2026-03-01 09:00:00" },
            { id: 2, entityType: "subtask", entityId: 5, status: "WIP", releaseVersion: null, changedAt: "2026-03-01 09:10:00" },
            { id: 3, entityType: "subtask", entityId: 5, status: "PR_COMMENTS", releaseVersion: null, changedAt: "2026-03-05 10:00:00" },
            { id: 4, entityType: "subtask", entityId: 5, status: "IN_REVIEW", releaseVersion: null, changedAt: "2026-03-05 17:00:00" },
            { id: 5, entityType: "subtask", entityId: 5, status: "CUT_RELEASE", releaseVersion: null, changedAt: "2026-03-05 19:00:00" },
        ]);
        renderPage();
        await screen.findByRole("heading", { name: "add saved card list endpoint" });

        const table = document.querySelector(".transitions-table") as HTMLTableElement;
        expect(table).toBeInTheDocument();
        const rows = table.querySelectorAll("tbody tr");
        expect(rows).toHaveLength(5);
        expect(rows[0]).toHaveTextContent("2026-03-01 09:00");
        expect(rows[0]).toHaveTextContent("-"); // no "time in previous" for the first row
        expect(rows[2]).toHaveTextContent("2026-03-05 10:00");
        expect(rows[2]).toHaveTextContent("pr comments");
        expect(rows[3]).toHaveTextContent("in review");
        expect(rows[3]).toHaveTextContent("0d 7h 0m"); // 10:00 -> 17:00
        expect(rows[4]).toHaveTextContent("cut release");
        expect(rows[4]).toHaveTextContent("0d 2h 0m"); // 17:00 -> 19:00
    });

    it("renders nothing for the transitions table when there is no history yet", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        vi.mocked(api.getSubtaskHistory).mockResolvedValue([]);
        renderPage();
        await screen.findByRole("heading", { name: "add saved card list endpoint" });
        expect(document.querySelector(".transitions-table")).not.toBeInTheDocument();
    });

    it("exports just this subtask as a single-section pdf when its export button is clicked", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        vi.mocked(api.getSubtaskHistory).mockResolvedValue([
            { id: 1, entityType: "subtask", entityId: 5, status: "NEW", releaseVersion: null, changedAt: "2026-03-01T00:00:00.000Z" },
            { id: 2, entityType: "subtask", entityId: 5, status: "WIP", releaseVersion: null, changedAt: "2026-03-03T00:00:00.000Z" },
        ]);
        renderPage();
        await screen.findByRole("heading", { name: "add saved card list endpoint" });
        await vi.waitFor(() => expect(screen.getByRole("button", { name: "export pdf" })).toBeEnabled());

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));

        expect(exportSectionsAsPdf).toHaveBeenCalledTimes(1);
        const [sections, filename] = vi.mocked(exportSectionsAsPdf).mock.calls[0];
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe("add saved card list endpoint (feature/x)");
        expect(sections[0].element).toBeUndefined();
        expect(sections[0].table).toEqual({
            headers: ["date/time", "state", "time in previous"],
            columnWidths: [55, 45, 55],
            rows: [
                [{ text: "2026-03-01 00:00" }, { text: "new", color: [107, 114, 128] }, { text: "-" }],
                [{ text: "2026-03-03 00:00" }, { text: "wip", color: [217, 89, 38] }, { text: "2d 0h 0m" }],
            ],
        });
        expect(sections[0].lines).toEqual(
            expect.arrayContaining([{ text: "Pull request: https://github.com/org/repo/pull/1", url: "https://github.com/org/repo/pull/1" }])
        );
        // subtask 5 sits second in the story's subtask list (NEB-1's jira
        // key, not either internal id, drives the filename).
        expect(filename).toMatch(/^NEB-1-subtask-2-export-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("disables the export button until the parent story (needed for its jira key) has loaded", async () => {
        vi.mocked(api.getSubtask).mockResolvedValue(subtask);
        let resolveStory!: (value: StoryDetail) => void;
        vi.mocked(api.getStory).mockReturnValue(new Promise((resolve) => (resolveStory = resolve)));

        renderPage();
        await screen.findByRole("heading", { name: "add saved card list endpoint" });
        expect(screen.getByRole("button", { name: "export pdf" })).toBeDisabled();

        resolveStory(story);
        await vi.waitFor(() => expect(screen.getByRole("button", { name: "export pdf" })).toBeEnabled());
    });
});
