import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import type { BurndownPoint, AdvancedBurndownPoint } from "../../../utils/burndown";
import { BurndownSection } from "./BurndownSection";
import { deferred } from "../../../testUtils/deferred";

const burndownPoints: BurndownPoint[] = [
    { date: "2026-03-02", actual: 4, ideal: 4 },
    { date: "2026-03-16", actual: 0, ideal: 0 },
];

const advancedBurndownPoints: AdvancedBurndownPoint[] = [
    { date: "2026-03-02", ideal: 4, counts: { NEW: 0, TESTING: 2, UAT: 2, DONE: 2 } },
    { date: "2026-03-16", ideal: 0, counts: { NEW: 0, TESTING: 0, UAT: 0, DONE: 0 } },
];

function renderSection(overrides: Partial<ComponentProps<typeof BurndownSection>> = {}) {
    return render(
        <BurndownSection
            granularity="subtask"
            setGranularity={vi.fn()}
            burndownPoints={burndownPoints}
            advancedBurndownPoints={advancedBurndownPoints}
            onExport={vi.fn()}
            {...overrides}
        />
    );
}

describe("BurndownSection", () => {
    it("shows the basic actual/ideal chart by default", () => {
        renderSection();
        const visibleChart = within(screen.getByTestId("burndown-chart-visible"));
        expect(visibleChart.getByText("actual")).toBeInTheDocument();
        expect(visibleChart.getByText("ideal")).toBeInTheDocument();
    });

    it("switches to the per-milestone chart when the advanced toggle is clicked", async () => {
        renderSection();
        await userEvent.click(screen.getByRole("button", { name: "advanced" }));

        const visibleChart = within(screen.getByTestId("burndown-chart-visible"));
        expect(visibleChart.queryByText("actual")).not.toBeInTheDocument();
        expect(visibleChart.getByText("ideal")).toBeInTheDocument();
        expect(visibleChart.getByText("new")).toBeInTheDocument();
        expect(visibleChart.getByText("testing")).toBeInTheDocument();
        expect(visibleChart.getByText("uat")).toBeInTheDocument();
        expect(visibleChart.getByText("done")).toBeInTheDocument();
    });

    it("switches back to the basic chart when the basic toggle is clicked", async () => {
        renderSection();
        await userEvent.click(screen.getByRole("button", { name: "advanced" }));
        await userEvent.click(screen.getByRole("button", { name: "basic" }));

        const visibleChart = within(screen.getByTestId("burndown-chart-visible"));
        expect(visibleChart.getByText("actual")).toBeInTheDocument();
    });

    it("calls setGranularity when the subtask/story toggle is clicked", async () => {
        const setGranularity = vi.fn();
        renderSection({ setGranularity });
        await userEvent.click(screen.getByRole("button", { name: "stories" }));
        expect(setGranularity).toHaveBeenCalledWith("story");
    });

    it("always renders both basic and advanced charts side by side in the off-screen export twin, regardless of the on-screen toggle", async () => {
        renderSection();
        await userEvent.click(screen.getByRole("button", { name: "advanced" }));

        const exportTwin = within(screen.getByTestId("burndown-chart-export"));
        expect(exportTwin.getByText("Basic")).toBeInTheDocument();
        expect(exportTwin.getByText("Advanced")).toBeInTheDocument();
    });

    it("forwards the ref to the export twin's inner container", () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <BurndownSection
                ref={ref}
                granularity="subtask"
                setGranularity={vi.fn()}
                burndownPoints={burndownPoints}
                advancedBurndownPoints={advancedBurndownPoints}
                onExport={vi.fn()}
            />
        );
        expect(ref.current).toBe(screen.getByTestId("burndown-chart-export").firstElementChild);
    });

    it("wires up the export button, owning its own loading state while the export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        renderSection({ onExport });

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
