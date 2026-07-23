import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { AdvancedBurndownPoint } from "#utils/burndown";
import { AdvancedBurndownChart } from "./AdvancedBurndownChart";

const points: AdvancedBurndownPoint[] = [
    { date: "2026-03-02", ideal: 6, counts: { NEW: 0, TESTING: 5, UAT: 6, DONE: 8 } },
    { date: "2026-03-03", ideal: 4, counts: { NEW: 0, TESTING: 3, UAT: 4, DONE: 6 } },
];

describe("AdvancedBurndownChart", () => {
    it("renders without throwing for a set of points and milestones", () => {
        const { container } = render(<AdvancedBurndownChart points={points} milestones={["NEW", "TESTING", "UAT", "DONE"]} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });

    it("shows the human label for each milestone plus 'ideal' in the legend", () => {
        const { container } = render(<AdvancedBurndownChart points={points} milestones={["NEW", "TESTING", "UAT", "DONE"]} />);
        expect(container.textContent).toContain("new");
        expect(container.textContent).toContain("testing");
        expect(container.textContent).toContain("uat");
        expect(container.textContent).toContain("done");
        expect(container.textContent).toContain("ideal");
    });

    it("draws one line per milestone plus the shared ideal line", () => {
        const { container } = render(<AdvancedBurndownChart points={points} milestones={["NEW", "TESTING", "UAT", "DONE"]} />);
        expect(container.querySelectorAll(".recharts-line")).toHaveLength(5);
    });

    it("renders an empty chart without throwing when there are no points", () => {
        const { container } = render(<AdvancedBurndownChart points={[]} milestones={["NEW"]} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });
});
