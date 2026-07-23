import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { StatusBreakdownPoint } from "@shared/types";
import { StatusHistorySection, type StatusHistorySectionHandle } from "./StatusHistorySection";
import { api } from "../../../api/client";
import { deferred } from "../../../testUtils/deferred";

vi.mock("../../../api/client", () => ({
    api: {
        getStatusBreakdown: vi.fn(),
    },
}));

const points: StatusBreakdownPoint[] = [{ date: "2026-03-10", counts: { NEW: 1, WIP: 1 } }];

beforeEach(() => {
    vi.mocked(api.getStatusBreakdown).mockReset().mockResolvedValue(points);
});

const isWorkingDay = () => true;

function renderSection(overrides: Partial<Parameters<typeof StatusHistorySection>[0]> = {}) {
    return render(
        <StatusHistorySection
            sprintId={1}
            isWorkingDay={isWorkingDay}
            onExportBurndown={vi.fn()}
            onExportStatusBreakdown={vi.fn()}
            {...overrides}
        />
    );
}

describe("StatusHistorySection", () => {
    it("fetches the status breakdown for the given sprint at subtask granularity by default", async () => {
        renderSection();
        await screen.findByText("Burndown");
        expect(api.getStatusBreakdown).toHaveBeenCalledWith(1, "subtask");
    });

    it("refetches at story granularity, driving both the burndown and status breakdown charts from one toggle", async () => {
        renderSection();
        await screen.findByText("Burndown");

        expect(screen.getAllByRole("button", { name: "stories" })).toHaveLength(1);
        await userEvent.click(screen.getByRole("button", { name: "stories" }));
        expect(api.getStatusBreakdown).toHaveBeenLastCalledWith(1, "story");
    });

    it("refetches when the sprintId prop changes", async () => {
        const { rerender } = renderSection();
        await screen.findByText("Burndown");

        rerender(
            <StatusHistorySection
                sprintId={2}
                isWorkingDay={isWorkingDay}
                onExportBurndown={vi.fn()}
                onExportStatusBreakdown={vi.fn()}
            />
        );
        expect(api.getStatusBreakdown).toHaveBeenLastCalledWith(2, "subtask");
    });

    it("exposes the Burndown and Status breakdown pdf sections via the imperative handle", async () => {
        const ref = createRef<StatusHistorySectionHandle>();
        renderSection({ ref });
        await screen.findByText("Burndown");

        const [burndownSection, statusBreakdownSection] = ref.current!.getReportSections();
        expect(burndownSection.title).toBe("Burndown");
        expect(burndownSection.element).toBeInstanceOf(HTMLElement);
        expect(burndownSection.lines).toEqual([
            "10/03/2026: 2 remaining (ideal 0)",
            "Milestones remaining (10/03/2026): new: 0, testing: 2, uat: 2, done: 2",
        ]);
        expect(statusBreakdownSection.title).toBe("Status breakdown (subtasks)");
        expect(statusBreakdownSection.lines).toEqual(["10/03/2026: new: 1, wip: 1"]);
    });

    it("wires up the burndown and status-breakdown export buttons independently, each owning its own loading state", async () => {
        const burndownExport = deferred();
        const statusBreakdownExport = deferred();
        const onExportBurndown = vi.fn(() => burndownExport.promise);
        const onExportStatusBreakdown = vi.fn(() => statusBreakdownExport.promise);
        renderSection({ onExportBurndown, onExportStatusBreakdown });
        await screen.findByText("Burndown");

        const exportButtons = screen.getAllByRole("button", { name: "export pdf" });
        expect(exportButtons).toHaveLength(2);

        await userEvent.click(exportButtons[0]);
        expect(onExportBurndown).toHaveBeenCalledOnce();
        expect(onExportStatusBreakdown).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "export pdf" })).toBeEnabled();

        burndownExport.resolve();
        await screen.findAllByRole("button", { name: "export pdf" });

        await userEvent.click(screen.getAllByRole("button", { name: "export pdf" })[1]);
        expect(onExportStatusBreakdown).toHaveBeenCalledOnce();

        statusBreakdownExport.resolve();
    });
});
