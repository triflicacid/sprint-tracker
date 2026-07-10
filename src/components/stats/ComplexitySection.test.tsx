import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ComplexityStats } from "@shared/types";
import { ComplexitySection, type ComplexitySectionHandle } from "./ComplexitySection";
import { api } from "../../api/client";
import { deferred } from "../../testUtils/deferred";

vi.mock("../../api/client", () => ({
    api: {
        getComplexityTiming: vi.fn(),
    },
}));

const complexity: ComplexityStats = {
    points: [{ subtaskId: 1, storyId: 1, storyLabel: "NEB-1", complexityRating: 3, runningTimeDays: 4 }],
    ratingCounts: { 3: 1 },
    unratedCount: 1,
    inProgressRatedCount: 0,
    storyComplexity: [{ storyId: 1, storyLabel: "NEB-1", totalComplexity: 3 }],
};

beforeEach(() => {
    vi.mocked(api.getComplexityTiming).mockReset().mockResolvedValue(complexity);
});

describe("ComplexitySection", () => {
    it("fetches complexity timing for the given sprint and renders the rating distribution and per-story summary", async () => {
        render(<ComplexitySection sprintId={1} onExport={vi.fn()} />);
        expect(await screen.findByText("complexity 3")).toBeInTheDocument();
        expect(api.getComplexityTiming).toHaveBeenCalledWith(1);
        expect(screen.getByText("complexity 3").previousElementSibling).toHaveTextContent("1");
        expect(screen.getByText("unrated").previousElementSibling).toHaveTextContent("1");
    });

    it("refetches when the sprintId prop changes", async () => {
        const { rerender } = render(<ComplexitySection sprintId={1} onExport={vi.fn()} />);
        await screen.findByText("complexity 3");

        rerender(<ComplexitySection sprintId={2} onExport={vi.fn()} />);
        expect(api.getComplexityTiming).toHaveBeenLastCalledWith(2);
    });

    it("renders zeroed rating tiles while there is no complexity data yet", () => {
        vi.mocked(api.getComplexityTiming).mockReturnValue(new Promise(() => {}));
        render(<ComplexitySection sprintId={1} onExport={vi.fn()} />);
        expect(screen.getByText("complexity 1").previousElementSibling).toHaveTextContent("0");
        expect(screen.getByText("unrated").previousElementSibling).toHaveTextContent("0");
        expect(
            screen.getByText("No done, rated subtasks yet to chart complexity against running time.")
        ).toBeInTheDocument();
    });

    it("still lists the average running time in the text below the chart for a rating with only one point", async () => {
        render(<ComplexitySection sprintId={1} onExport={vi.fn()} />);
        expect(await screen.findByText(/Average running time by complexity/)).toHaveTextContent("3: 4 days");
    });

    it("does not draw the average square marker on the chart for a rating with only one point", async () => {
        const { container } = render(<ComplexitySection sprintId={1} onExport={vi.fn()} />);
        await screen.findByText(/Average running time by complexity/);
        await vi.waitFor(() => {
            expect(container.querySelectorAll('[fill="#ffffff"]')).toHaveLength(0);
        });
    });

    it("draws the average square marker on the chart for a rating with more than one point", async () => {
        vi.mocked(api.getComplexityTiming).mockResolvedValue({
            points: [
                { subtaskId: 1, storyId: 1, storyLabel: "NEB-1", complexityRating: 3, runningTimeDays: 2 },
                { subtaskId: 2, storyId: 2, storyLabel: "NEB-2", complexityRating: 3, runningTimeDays: 6 },
            ],
            ratingCounts: { 3: 2 },
            unratedCount: 0,
            inProgressRatedCount: 0,
            storyComplexity: [
                { storyId: 1, storyLabel: "NEB-1", totalComplexity: 3 },
                { storyId: 2, storyLabel: "NEB-2", totalComplexity: 3 },
            ],
        });
        const { container } = render(<ComplexitySection sprintId={1} onExport={vi.fn()} />);

        expect(await screen.findByText(/Average running time by complexity/)).toHaveTextContent("3: 4 days");
        await vi.waitFor(() => {
            expect(container.querySelectorAll('[fill="#ffffff"]').length).toBeGreaterThan(0);
        });
    });

    it("exposes the Complexity pdf section (text and chart dom node) via the imperative handle", async () => {
        const ref = createRef<ComplexitySectionHandle>();
        render(<ComplexitySection ref={ref} sprintId={1} onExport={vi.fn()} />);
        await screen.findByText("complexity 3");

        const section = ref.current!.getReportSection();
        expect(section.title).toBe("Complexity");
        expect(section.element).toBeInstanceOf(HTMLElement);
        expect(section.lines).toEqual([
            "Complexity 1: 0 subtasks",
            "Complexity 2: 0 subtasks",
            "Complexity 3: 1 subtask (NEB-1), with an average running time of 4 days",
            "Complexity 4: 0 subtasks",
            "Complexity 5: 0 subtasks",
            "Unrated/not done: 1",
        ]);
    });

    it("wires up the export button, owning its own loading state while the export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        render(<ComplexitySection sprintId={1} onExport={onExport} />);
        await screen.findByText("complexity 3");

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
