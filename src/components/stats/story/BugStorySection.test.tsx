import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { BugStorySection } from "./BugStorySection";
import { deferred } from "#testUtils/deferred";

describe("BugStorySection", () => {
    it("renders a pie chart split between bugs and (non-bug) stories", () => {
        const { container } = render(<BugStorySection storyCount={4} bugCount={1} onExport={vi.fn()} />);
        expect(screen.getByText("Bugs vs stories")).toBeInTheDocument();
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });

    it("shows a fallback message instead of a chart when there are no stories yet", () => {
        render(<BugStorySection storyCount={0} bugCount={0} onExport={vi.fn()} />);
        expect(screen.getByText("No stories recorded yet.")).toBeInTheDocument();
    });

    it("forwards the ref to the chart's wrapping element, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(<BugStorySection ref={ref} storyCount={4} bugCount={1} onExport={vi.fn()} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current?.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(ref.current?.textContent).not.toContain("Bugs vs stories");
    });

    it("wires up the export button, owning its own loading state while the export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        render(<BugStorySection storyCount={4} bugCount={1} onExport={onExport} />);

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
