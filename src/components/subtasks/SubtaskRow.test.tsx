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
        { id: "CUT_RELEASE", label: "cut release", rank: 3, color: "#d55181", description: "", locksComplexity: true },
    ],
    transitions: [
        { from: "NEW", to: ["WIP"], requires: [{ field: "branchName", label: "Branch name", type: "text", column: "subtasks.branch_name" }] },
        { from: "WIP", to: ["IN_PR"] },
        { from: "IN_PR", to: ["CUT_RELEASE"] },
        { from: "CUT_RELEASE", to: [] },
    ],
};

const baseSubtask: Subtask = {
    id: 1,
    storyId: 10,
    storyJiraKey: "NEB-1234",
    title: "add endpoint",
    comment: null,
    branchName: "(unknown)",
    status: "NEW",
    url: null,
    repoName: null,
    complexityRating: null,
    releaseVersion: null,
    type: "unknown",
    createdAt: "2026-01-01",
};

function renderRow(subtask: Subtask, disableNavigation = false, sprintLocked = false) {
    const onChanged = vi.fn();
    render(
        <MemoryRouter initialEntries={["/stories/10"]}>
            <ToastProvider>
                <Routes>
                    <Route
                        path="/stories/:id"
                        element={
                            <SubtaskRow
                                subtask={subtask}
                                flow={flow}
                                onChanged={onChanged}
                                disableNavigation={disableNavigation}
                                sprintLocked={sprintLocked}
                            />
                        }
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
    it("prefills branchName from the type, jira key, and title", async () => {
        renderRow({ ...baseSubtask, type: "feature" });

        await userEvent.click(screen.getByText("wip"));

        expect(screen.getByPlaceholderText("Branch name")).toHaveValue("feature/NEB-1234-add-endpoint");
    });

    it("prompts for the required field and submits the transition", async () => {
        vi.mocked(api.updateSubtask).mockResolvedValue({
            ...baseSubtask,
            status: "WIP",
            branchName: "feature/NEB-1234-add-endpoint",
            type: "feature",
        });
        const { onChanged } = renderRow(baseSubtask);

        await userEvent.click(screen.getByText("wip"));
        await userEvent.click(screen.getByText("confirm"));

        expect(api.updateSubtask).toHaveBeenCalledWith(1, { status: "WIP", branchName: "unknown/NEB-1234-add-endpoint" });
        expect(onChanged).toHaveBeenCalledOnce();
    });

    it("lets the user replace the generated branch name normally", async () => {
        vi.mocked(api.updateSubtask).mockResolvedValue({ ...baseSubtask, status: "WIP", branchName: "feature/custom-name" });
        renderRow({ ...baseSubtask, type: "feature" });

        await userEvent.click(screen.getByText("wip"));
        const input = screen.getByPlaceholderText("Branch name");

        expect(input).toHaveFocus();
        expect((input as HTMLInputElement).selectionStart).toBe(0);
        expect((input as HTMLInputElement).selectionEnd).toBe("feature/NEB-1234-add-endpoint".length);

        await userEvent.type(input, "feature/custom-name");
        await userEvent.click(screen.getByText("confirm"));

        expect(api.updateSubtask).toHaveBeenCalledWith(1, { status: "WIP", branchName: "feature/custom-name" });
    });

    it("shows a toast and does not call onChanged when the update fails", async () => {
        vi.mocked(api.updateSubtask).mockRejectedValue(new Error("cannot move from NEW to WIP"));
        const { onChanged } = renderRow(baseSubtask);

        await userEvent.click(screen.getByText("wip"));
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

    it("disables the complexity select once the subtask is in a state that locks it", () => {
        renderRow({
            ...baseSubtask,
            status: "CUT_RELEASE",
            url: "https://github.com/org/repo/pull/1",
            complexityRating: 3,
        });
        expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("leaves the complexity select enabled for states that don't lock it", () => {
        renderRow({ ...baseSubtask, status: "IN_PR", url: "https://github.com/org/repo/pull/1" });
        expect(screen.getByRole("combobox")).toBeEnabled();
    });
});

describe("SubtaskRow - sprint locked", () => {
    it("does not show the next-state transition badges", () => {
        renderRow(baseSubtask, false, true);
        expect(screen.queryByText("wip")).not.toBeInTheDocument();
        expect(screen.queryByText("→")).not.toBeInTheDocument();
    });

    it("shows the complexity as plain text instead of a select, even in a state that would otherwise allow editing it", () => {
        renderRow(
            { ...baseSubtask, status: "IN_PR", url: "https://github.com/org/repo/pull/1", complexityRating: 3 },
            false,
            true
        );
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        expect(screen.getByText(/complexity: 3/)).toBeInTheDocument();
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
