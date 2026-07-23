import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { StatusBreakdownPoint } from "@shared/types";
import { StatusBreakdownChart } from "./StatusBreakdownChart";

const points: StatusBreakdownPoint[] = [
    { date: "2026-03-02", counts: { NEW: 2, WIP: 1, DONE: 0 } },
    { date: "2026-03-03", counts: { NEW: 1, WIP: 2, DONE: 0 } },
];

describe("StatusBreakdownChart", () => {
    it("renders without throwing for a set of points and statuses", () => {
        const { container } = render(<StatusBreakdownChart points={points} statuses={["NEW", "WIP", "DONE"]} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });

    it("shows the human label for each status in the legend", () => {
        const { container } = render(<StatusBreakdownChart points={points} statuses={["NEW", "WIP", "DONE"]} />);
        expect(container.textContent).toContain("new");
        expect(container.textContent).toContain("wip");
        expect(container.textContent).toContain("done");
    });

    it("renders an empty chart without throwing when there are no points", () => {
        const { container } = render(<StatusBreakdownChart points={[]} statuses={["NEW"]} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });
});
