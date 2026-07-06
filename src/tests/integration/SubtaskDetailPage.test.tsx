import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { StatusFlowConfig, Subtask } from "@shared/types";
import { SubtaskDetailPage } from "../../pages/SubtaskDetailPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({
    api: {
        getSubtask: vi.fn(),
        getSubtaskHistory: vi.fn(),
        getStatusFlow: vi.fn(),
        updateSubtask: vi.fn(),
    },
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

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
    vi.mocked(api.getSubtaskHistory).mockResolvedValue([]);
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
});
