import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { BurndownPoint } from "#utils/burndown";
import { BurndownChart } from "./BurndownChart";

const points: BurndownPoint[] = [
    { date: "2026-03-02", actual: 10, ideal: 8 },
    { date: "2026-03-03", actual: 8, ideal: 6 },
];

describe("BurndownChart", () => {
    it("renders without throwing for a set of points", () => {
        const { container } = render(<BurndownChart points={points} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });

    it("shows an actual and an ideal line in the legend", () => {
        const { container } = render(<BurndownChart points={points} />);
        expect(container.textContent).toContain("actual");
        expect(container.textContent).toContain("ideal");
    });

    it("renders an empty chart without throwing when there are no points", () => {
        const { container } = render(<BurndownChart points={[]} />);
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
    });
});
