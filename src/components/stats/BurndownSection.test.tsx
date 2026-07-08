import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import type { BurndownPoint, AdvancedBurndownPoint } from "../../utils/burndown";
import { BurndownSection } from "./BurndownSection";

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
            burndownMode="basic"
            setBurndownMode={vi.fn()}
            granularity="subtask"
            setGranularity={vi.fn()}
            burndownPoints={burndownPoints}
            advancedBurndownPoints={advancedBurndownPoints}
            onExport={vi.fn()}
            loading={false}
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

    it("shows the per-milestone chart when mode is advanced", () => {
        renderSection({ burndownMode: "advanced" });
        const visibleChart = within(screen.getByTestId("burndown-chart-visible"));
        expect(visibleChart.queryByText("actual")).not.toBeInTheDocument();
        expect(visibleChart.getByText("ideal")).toBeInTheDocument();
        expect(visibleChart.getByText("new")).toBeInTheDocument();
        expect(visibleChart.getByText("testing")).toBeInTheDocument();
        expect(visibleChart.getByText("uat")).toBeInTheDocument();
        expect(visibleChart.getByText("done")).toBeInTheDocument();
    });

    it("calls setBurndownMode when the basic/advanced toggle is clicked", async () => {
        const setBurndownMode = vi.fn();
        renderSection({ setBurndownMode });
        await userEvent.click(screen.getByRole("button", { name: "advanced" }));
        expect(setBurndownMode).toHaveBeenCalledWith("advanced");
    });

    it("calls setGranularity when the subtask/story toggle is clicked", async () => {
        const setGranularity = vi.fn();
        renderSection({ setGranularity });
        await userEvent.click(screen.getByRole("button", { name: "stories" }));
        expect(setGranularity).toHaveBeenCalledWith("story");
    });

    it("always renders both basic and advanced charts side by side in the off-screen export twin", () => {
        renderSection({ burndownMode: "basic" });
        const exportTwin = within(screen.getByTestId("burndown-chart-export"));
        expect(exportTwin.getByText("Basic")).toBeInTheDocument();
        expect(exportTwin.getByText("Advanced")).toBeInTheDocument();
    });

    it("forwards the ref to the export twin's inner container", () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <BurndownSection
                ref={ref}
                burndownMode="basic"
                setBurndownMode={vi.fn()}
                granularity="subtask"
                setGranularity={vi.fn()}
                burndownPoints={burndownPoints}
                advancedBurndownPoints={advancedBurndownPoints}
                onExport={vi.fn()}
                loading={false}
            />
        );
        expect(ref.current).toBe(screen.getByTestId("burndown-chart-export").firstElementChild);
    });

    it("wires up the export button", async () => {
        const onExport = vi.fn();
        renderSection({ onExport });
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
    });
});
