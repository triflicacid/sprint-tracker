import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { CalendarSection, type CalendarSectionHandle } from "./CalendarSection";
import { api } from "../../../api/client";
import { deferred } from "../../../testUtils/deferred";

vi.mock("../../../api/client", () => ({
    api: {
        getDayActivity: vi.fn(),
    },
}));

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getDayActivity).mockResolvedValue({});
});

function renderSection(overrides: Partial<Parameters<typeof CalendarSection>[0]> = {}) {
    return render(
        <CalendarSection
            sprintId={1}
            startDate="2026-03-02"
            endDate="2026-03-16"
            holidays={new Set()}
            totalWeekdays={11}
            holidayWeekdays={0}
            onExport={vi.fn()}
            {...overrides}
        />
    );
}

describe("CalendarSection", () => {
    it("fetches day activity for the given sprint and renders the calendar for its date range", async () => {
        renderSection();
        expect(screen.getByText("Calendar")).toBeInTheDocument();
        expect(await screen.findByText("March 2026")).toBeInTheDocument();
        expect(api.getDayActivity).toHaveBeenCalledWith(1);
    });

    it("renders holidays as read-only", async () => {
        renderSection({ holidays: new Set(["2026-03-05"]) });
        await screen.findByText("March 2026");

        const day = screen.getByText("5", { selector: ".calendar-day-number" }).closest(".calendar-day") as HTMLElement;
        expect(day).toHaveClass("calendar-day-holiday");
        expect(day).not.toHaveClass("calendar-day-clickable");
    });

    it("exposes the Calendar pdf section (text and dom node) via the imperative handle", async () => {
        vi.mocked(api.getDayActivity).mockResolvedValue({ "2026-03-05": [] });
        const ref = createRef<CalendarSectionHandle>();
        render(
            <CalendarSection
                ref={ref}
                sprintId={1}
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set(["2026-03-01"])}
                totalWeekdays={11}
                holidayWeekdays={1}
                onExport={vi.fn()}
            />
        );
        await screen.findByText("March 2026");

        const section = ref.current!.getReportSection();
        expect(section.title).toBe("Calendar");
        expect(section.element).toBeInstanceOf(HTMLElement);
        expect(section.lines).toEqual([
            "11 working days between 02/03/2026 and 16/03/2026",
            "1 of those were holidays",
            "1 day had subtask activity",
        ]);
    });

    it("wires up the export button, owning its own loading state while the export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        renderSection({ onExport });
        await screen.findByText("March 2026");

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
