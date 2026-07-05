import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
    description: "add saved card list endpoint",
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

        // the description renders twice - once as the page <h1>, once inside
        // the embedded SubtaskRow - so scope to the heading specifically.
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
});
