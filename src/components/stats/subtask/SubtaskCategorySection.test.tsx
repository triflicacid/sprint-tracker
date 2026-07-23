import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { SubtaskCategorySection } from "./SubtaskCategorySection";
import { deferred } from "../../../testUtils/deferred";

const typeCounts = [
    { type: "feature", count: 5 },
    { type: "bugfix", count: 3 },
    { type: "spike", count: 1 },
];

describe("SubtaskCategorySection", () => {
    it("renders the section heading", () => {
        render(<SubtaskCategorySection typeCounts={typeCounts} onExport={vi.fn()} />);
        expect(screen.getByText("Subtask category breakdown")).toBeInTheDocument();
    });

    it("renders a pie chart when there are type counts", () => {
        const { container } = render(<SubtaskCategorySection typeCounts={typeCounts} onExport={vi.fn()} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });

    it("shows the 'no subtasks' fallback message when typeCounts is empty", () => {
        render(<SubtaskCategorySection typeCounts={[]} onExport={vi.fn()} />);
        expect(screen.getByText("No subtasks recorded yet.")).toBeInTheDocument();
    });

    it("does not render a chart when there are no type counts", () => {
        const { container } = render(<SubtaskCategorySection typeCounts={[]} onExport={vi.fn()} />);
        expect(container.querySelector(".recharts-responsive-container")).toBeNull();
    });

    it("forwards the ref to the chart wrapper, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(<SubtaskCategorySection ref={ref} typeCounts={typeCounts} onExport={vi.fn()} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current?.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(ref.current?.textContent).not.toContain("Subtask category breakdown");
    });

    it("wires up the export button with loading state while export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        render(<SubtaskCategorySection typeCounts={typeCounts} onExport={onExport} />);

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});

