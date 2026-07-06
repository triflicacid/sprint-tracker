import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { SprintSummary } from "@shared/types";
import { ExportPage } from "../../pages/ExportPage";
import { ToastProvider } from "../../components/Toast";
import { api } from "../../api/client";
import { downloadTextFile } from "../../utils/download";

vi.mock("../../api/client", () => ({
    api: {
        listSprints: vi.fn(),
        exportMarkdown: vi.fn(),
    },
}));

vi.mock("../../utils/download", () => ({
    downloadTextFile: vi.fn(),
}));

const sprints: SprintSummary[] = [
    {
        id: 1,
        name: "Sprint One",
        startDate: "2026-01-01",
        endDate: "2026-01-14",
        comment: null,
        storyCount: 0,
        prCount: 0,
    },
    {
        id: 2,
        name: "Sprint Two",
        startDate: "2026-02-01",
        endDate: "2026-02-14",
        comment: null,
        storyCount: 0,
        prCount: 0,
    },
];

beforeEach(() => {
    localStorage.clear();
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(downloadTextFile).mockReset();
    vi.mocked(api.listSprints).mockResolvedValue(sprints);
});

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/export"]}>
            <ToastProvider>
                <Routes>
                    <Route path="/export" element={<ExportPage />} />
                </Routes>
            </ToastProvider>
        </MemoryRouter>
    );
}

describe("ExportPage", () => {
    it("lists every sprint", async () => {
        renderPage();
        expect(await screen.findByText(/Sprint One/)).toBeInTheDocument();
        expect(screen.getByText(/Sprint Two/)).toBeInTheDocument();
    });

    it("disables generate until at least one sprint is selected", async () => {
        renderPage();
        await screen.findByText(/Sprint One/);
        expect(screen.getByText("generate export")).toBeDisabled();

        await userEvent.click(screen.getAllByRole("checkbox")[0]);
        expect(screen.getByText("generate export")).not.toBeDisabled();
    });

    it("generates and downloads a export with the selected sprint and default (all-true) fields", async () => {
        vi.mocked(api.exportMarkdown).mockResolvedValue("# Sprint One\n");
        renderPage();
        await screen.findByText(/Sprint One/);

        const sprintCheckbox = screen.getByText(/Sprint One/).closest("label")!.querySelector("input")!;
        await userEvent.click(sprintCheckbox);
        await userEvent.click(screen.getByText("generate export"));

        expect(api.exportMarkdown).toHaveBeenCalledWith(
            [1],
            expect.objectContaining({
                story: expect.objectContaining({ title: true }),
                subtask: expect.objectContaining({ title: true }),
            })
        );
        expect(downloadTextFile).toHaveBeenCalledWith(expect.stringMatching(/^sprint-export-.*\.md$/), "# Sprint One\n");
    });

    it("excludes a deselected field from the request", async () => {
        vi.mocked(api.exportMarkdown).mockResolvedValue("markdown");
        renderPage();
        await screen.findByText(/Sprint One/);

        await userEvent.click(screen.getByText(/Sprint One/).closest("label")!.querySelector("input")!);
        await userEvent.click(screen.getByText("Comment", { exact: true }));
        await userEvent.click(screen.getByText("generate export"));

        expect(api.exportMarkdown).toHaveBeenCalledWith(
            [1],
            expect.objectContaining({ subtask: expect.objectContaining({ comment: false }) })
        );
    });

    it("selects only sprints overlapping the given date range", async () => {
        renderPage();
        await screen.findByText(/Sprint One/);

        const [fromInput, toInput] = document.querySelectorAll(".export-date-range input[type='date']");
        await userEvent.type(fromInput as HTMLInputElement, "2026-01-01");
        await userEvent.type(toInput as HTMLInputElement, "2026-01-14");
        await userEvent.click(screen.getByText("select sprints in range"));

        const oneCheckbox = screen.getByText(/Sprint One/).closest("label")!.querySelector("input") as HTMLInputElement;
        const twoCheckbox = screen.getByText(/Sprint Two/).closest("label")!.querySelector("input") as HTMLInputElement;
        expect(oneCheckbox.checked).toBe(true);
        expect(twoCheckbox.checked).toBe(false);
    });

    it("resets a changed field back to its default via 'reset to defaults'", async () => {
        renderPage();
        await screen.findByText(/Sprint One/);

        const commentCheckbox = screen.getByText("Comment", { exact: true }).closest("label")!.querySelector("input") as HTMLInputElement;
        await userEvent.click(commentCheckbox);
        expect(commentCheckbox.checked).toBe(false);

        await userEvent.click(screen.getByText("reset to defaults"));
        expect(commentCheckbox.checked).toBe(true);
    });

    it("persists field changes to localStorage across a remount", async () => {
        const { unmount } = renderPage();
        await screen.findByText(/Sprint One/);
        await userEvent.click(screen.getByText("Comment", { exact: true }));
        unmount();

        renderPage();
        await screen.findByText(/Sprint One/);
        const commentCheckbox = screen.getByText("Comment", { exact: true }).closest("label")!.querySelector("input") as HTMLInputElement;
        expect(commentCheckbox.checked).toBe(false);
    });
});
