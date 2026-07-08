import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ComplexityStats } from "@shared/types";
import { ComplexitySection } from "./ComplexitySection";

const complexity: ComplexityStats = {
    points: [{ subtaskId: 1, storyId: 1, storyLabel: "NEB-1", complexityRating: 3, runningTimeDays: 4 }],
    ratingCounts: { 3: 1 },
    unratedCount: 1,
    inProgressRatedCount: 0,
    storyComplexity: [{ storyId: 1, storyLabel: "NEB-1", totalComplexity: 3 }],
};

describe("ComplexitySection", () => {
    it("renders the rating distribution and per-story summary", () => {
        render(<ComplexitySection complexity={complexity} onExport={vi.fn()} loading={false} />);
        expect(screen.getByText("Complexity")).toBeInTheDocument();
        expect(screen.getByText("complexity 3").previousElementSibling).toHaveTextContent("1");
        expect(screen.getByText("unrated").previousElementSibling).toHaveTextContent("1");
    });

    it("renders zeroed rating tiles and an unrated tile when there is no complexity data yet", () => {
        render(<ComplexitySection complexity={null} onExport={vi.fn()} loading={false} />);
        expect(screen.getByText("complexity 1").previousElementSibling).toHaveTextContent("0");
        expect(screen.getByText("unrated").previousElementSibling).toHaveTextContent("0");
        expect(
            screen.getByText("No done, rated subtasks yet to chart complexity against running time.")
        ).toBeInTheDocument();
    });

    it("still lists the average running time in the text below the chart for a rating with only one point", () => {
        render(<ComplexitySection complexity={complexity} onExport={vi.fn()} loading={false} />);
        expect(screen.getByText(/Average running time by complexity/)).toHaveTextContent("3: 4 days");
    });

    it("does not draw the average square marker on the chart for a rating with only one point", () => {
        const { container } = render(<ComplexitySection complexity={complexity} onExport={vi.fn()} loading={false} />);
        expect(container.querySelectorAll('[fill="#ffffff"]')).toHaveLength(0);
    });

    it("draws the average square marker on the chart for a rating with more than one point", () => {
        const multiPointComplexity: ComplexityStats = {
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
        };
        const { container } = render(
            <ComplexitySection complexity={multiPointComplexity} onExport={vi.fn()} loading={false} />
        );
        expect(screen.getByText(/Average running time by complexity/)).toHaveTextContent("3: 4 days");
        expect(container.querySelectorAll('[fill="#ffffff"]').length).toBeGreaterThan(0);
    });

    it("forwards the ref to the content wrapper, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(<ComplexitySection ref={ref} complexity={complexity} onExport={vi.fn()} loading={false} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current?.textContent).not.toContain("Complexity");
        expect(ref.current?.textContent).toContain("unrated");
    });

    it("wires up the export button", async () => {
        const onExport = vi.fn();
        render(<ComplexitySection complexity={complexity} onExport={onExport} loading={false} />);
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
    });
});
