import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { SprintStats } from "@shared/types";
import { TimePerStorySection } from "./TimePerStorySection";

const storyTimeDays: SprintStats["storyTimeDays"] = [
    { storyId: 1, storyLabel: "NEB-1", description: "a story", days: 4 },
    { storyId: 2, storyLabel: "NEB-2", description: "another story", days: 2 },
];

describe("TimePerStorySection", () => {
    it("renders a chart tick for each story", () => {
        const { container } = render(
            <TimePerStorySection storyTimeDays={storyTimeDays} onExport={vi.fn()} loading={false} />
        );
        expect(screen.getByText("Time per story (days)")).toBeInTheDocument();
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(container.textContent).toContain("NEB-1");
        expect(container.textContent).toContain("NEB-2");
    });

    it("forwards the ref to the chart's wrapping element, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(<TimePerStorySection ref={ref} storyTimeDays={storyTimeDays} onExport={vi.fn()} loading={false} />);
        expect(ref.current?.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(ref.current?.textContent).not.toContain("Time per story");
    });

    it("wires up the export button", async () => {
        const onExport = vi.fn();
        render(<TimePerStorySection storyTimeDays={storyTimeDays} onExport={onExport} loading={false} />);
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
    });
});
