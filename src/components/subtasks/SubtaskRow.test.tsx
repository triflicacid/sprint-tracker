import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Subtask, StatusFlowConfig } from "@shared/types";
import { SubtaskRow } from "./SubtaskRow";
import { ToastProvider } from "../Toast";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({
    api: {
        updateSubtask: vi.fn(),
    },
}));

const flow: StatusFlowConfig = {
    states: [
        { id: "NEW", label: "new", rank: 0, color: "#6b7280", description: "" },
        { id: "WIP", label: "wip", rank: 1, color: "#d95926", description: "" },
        { id: "IN_PR", label: "in pr", rank: 2, color: "#9085e9", description: "" },
    ],
    transitions: [
        { from: "NEW", to: ["WIP"], requires: [{ field: "branchName", label: "Branch name", type: "text", column: "subtasks.branch_name" }] },
        { from: "WIP", to: ["IN_PR"] },
        { from: "IN_PR", to: [] },
    ],
};

const baseSubtask: Subtask = {
    id: 1,
    storyId: 10,
    title: "add endpoint",
    comment: null,
    branchName: "(unknown)",
    status: "NEW",
    url: null,
    repoName: null,
    complexityRating: null,
    releaseVersion: null,
    createdAt: "2026-01-01",
};

function renderRow(subtask: Subtask, disableNavigation = false) {
    const onChanged = vi.fn();
    render(
        <MemoryRouter initialEntries={["/stories/10"]}>
            <ToastProvider>
                <Routes>
                    <Route
                        path="/stories/:id"
                        element={<SubtaskRow subtask={subtask} flow={flow} onChanged={onChanged} disableNavigation={disableNavigation} />}
                    />
                    <Route path="/subtasks/:id" element={<div>subtask detail page</div>} />
                </Routes>
            </ToastProvider>
        </MemoryRouter>
    );
    return { onChanged };
}

beforeEach(() => {
    vi.mocked(api.updateSubtask).mockReset();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("SubtaskRow - rendering", () => {
    it("shows the branch name, title and current status", () => {
        renderRow(baseSubtask);
        expect(screen.getByText("(unknown)")).toBeInTheDocument();
        expect(screen.getByText("add endpoint")).toBeInTheDocument();
        expect(screen.getByText("new")).toBeInTheDocument();
    });

    it("does not show the comment, even when one is set", () => {
        renderRow({ ...baseSubtask, comment: "watch out for the flaky test here" });
        expect(screen.queryByText("watch out for the flaky test here")).not.toBeInTheDocument();
    });

    it("shows a muted badge for each allowed next state", () => {
        renderRow(baseSubtask);
        expect(screen.getByText("wip")).toBeInTheDocument();
    });

    it("shows the pr link, complexity select and release version once a pr exists", () => {
        renderRow({
            ...baseSubtask,
            status: "IN_PR",
            url: "https://github.com/org/repo/pull/42",
            repoName: "repo",
            complexityRating: 3,
            releaseVersion: "v1.0.0",
        });
        expect(screen.getByText("repo #42")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveValue("3");
        expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    });

    it("renders the branch as a github tree link once a pr url is known", () => {
        renderRow({ ...baseSubtask, status: "IN_PR", url: "https://github.com/org/repo/pull/42", branchName: "feature/x" });
        expect(screen.getByText("feature/x")).toHaveAttribute("href", "https://github.com/org/repo/tree/feature/x");
    });

    it("percent-encodes special characters within each branch path segment", () => {
        renderRow({
            ...baseSubtask,
            status: "IN_PR",
            url: "https://github.com/org/repo/pull/42",
            branchName: "feature/fix bug",
        });
        expect(screen.getByText("feature/fix bug")).toHaveAttribute(
            "href",
            "https://github.com/org/repo/tree/feature/fix%20bug"
        );
    });
});

describe("SubtaskRow - status transitions", () => {
    it("prompts for the required field and submits the transition", async () => {
        vi.mocked(api.updateSubtask).mockResolvedValue({ ...baseSubtask, status: "WIP", branchName: "feature/x" });
        const { onChanged } = renderRow(baseSubtask);

        await userEvent.click(screen.getByText("wip"));
        const input = screen.getByPlaceholderText("Branch name");
        await userEvent.type(input, "feature/x");
        await userEvent.click(screen.getByText("confirm"));

        expect(api.updateSubtask).toHaveBeenCalledWith(1, { status: "WIP", branchName: "feature/x" });
        expect(onChanged).toHaveBeenCalledOnce();
    });

    it("shows a toast and does not call onChanged when the update fails", async () => {
        vi.mocked(api.updateSubtask).mockRejectedValue(new Error("cannot move from NEW to WIP"));
        const { onChanged } = renderRow(baseSubtask);

        await userEvent.click(screen.getByText("wip"));
        await userEvent.type(screen.getByPlaceholderText("Branch name"), "feature/x");
        await userEvent.click(screen.getByText("confirm"));

        expect(await screen.findByText("cannot move from NEW to WIP")).toBeInTheDocument();
        expect(onChanged).not.toHaveBeenCalled();
    });

    it("updates complexity rating via the select", async () => {
        vi.mocked(api.updateSubtask).mockResolvedValue({ ...baseSubtask, status: "IN_PR", url: "https://x", complexityRating: 4 });
        const { onChanged } = renderRow({ ...baseSubtask, status: "IN_PR", url: "https://github.com/org/repo/pull/1" });

        await userEvent.selectOptions(screen.getByRole("combobox"), "4");
        expect(api.updateSubtask).toHaveBeenCalledWith(1, { complexityRating: 4 });
        expect(onChanged).toHaveBeenCalledOnce();
    });
});

describe("SubtaskRow - navigation", () => {
    it("navigates to the subtask detail page when the row is clicked", async () => {
        renderRow(baseSubtask);
        await userEvent.click(screen.getByText("add endpoint"));
        expect(await screen.findByText("subtask detail page")).toBeInTheDocument();
    });

    it("does not navigate when disableNavigation is set", async () => {
        renderRow(baseSubtask, true);
        await userEvent.click(screen.getByText("add endpoint"));
        expect(screen.queryByText("subtask detail page")).not.toBeInTheDocument();
    });

    it("does not navigate when clicking the status badge area (stopPropagation)", async () => {
        renderRow(baseSubtask);
        await userEvent.click(screen.getByText("new"));
        expect(screen.queryByText("subtask detail page")).not.toBeInTheDocument();
    });

    it("does not navigate when clicking the complexity select (stopPropagation)", async () => {
        renderRow({ ...baseSubtask, status: "IN_PR", url: "https://github.com/org/repo/pull/1" });
        await userEvent.click(screen.getByRole("combobox"));
        expect(screen.queryByText("subtask detail page")).not.toBeInTheDocument();
    });
});
