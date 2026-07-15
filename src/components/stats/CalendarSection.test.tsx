import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { CalendarSection, type CalendarSectionHandle } from "./CalendarSection";
import { api } from "../../api/client";
import { deferred } from "../../testUtils/deferred";

vi.mock("../../api/client", () => ({
    api: {
        getDayActivity: vi.fn(),
        listHolidays: vi.fn(),
        addHoliday: vi.fn(),
        removeHoliday: vi.fn(),
    },
}));

beforeEach(() => {
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getDayActivity).mockResolvedValue({});
    vi.mocked(api.listHolidays).mockResolvedValue([]);
});

function renderSection(overrides: Partial<Parameters<typeof CalendarSection>[0]> = {}) {
    return render(
        <CalendarSection
            sprintId={1}
            startDate="2026-03-02"
            endDate="2026-03-16"
            holidays={new Set()}
            onHolidaysChange={vi.fn()}
            totalWeekdays={11}
            holidayWeekdays={0}
            onExport={vi.fn()}
            {...overrides}
        />
    );
}

describe("CalendarSection", () => {
    it("fetches day activity for the given sprint and renders the calendar for its date range", async () => {
        render(
            <CalendarSection
                sprintId={1}
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onHolidaysChange={vi.fn()}
                totalWeekdays={11}
                holidayWeekdays={0}
                onExport={vi.fn()}
            />
        );
        expect(screen.getByText("Calendar")).toBeInTheDocument();
        expect(await screen.findByText("March 2026")).toBeInTheDocument();
        expect(api.getDayActivity).toHaveBeenCalledWith(1);
    });

    it("adds a holiday, refetches, and reports the refreshed set back via onHolidaysChange", async () => {
        vi.mocked(api.addHoliday).mockResolvedValue(undefined);
        vi.mocked(api.listHolidays).mockResolvedValue(["2026-03-05"]);
        const onHolidaysChange = vi.fn();
        renderSection({ onHolidaysChange });
        await screen.findByText("March 2026");

        await userEvent.click(screen.getByText("5", { selector: ".calendar-day-number" }));

        expect(api.addHoliday).toHaveBeenCalledWith("2026-03-05");
        expect(api.listHolidays).toHaveBeenCalledWith("2026-03-02", "2026-03-16");
        expect(onHolidaysChange).toHaveBeenCalledWith(new Set(["2026-03-05"]));
    });

    it("removes a holiday when an already-marked day is clicked", async () => {
        vi.mocked(api.removeHoliday).mockResolvedValue(undefined);
        vi.mocked(api.listHolidays).mockResolvedValue([]);
        const onHolidaysChange = vi.fn();
        renderSection({ holidays: new Set(["2026-03-05"]), onHolidaysChange });
        await screen.findByText("March 2026");

        await userEvent.click(screen.getByText("5", { selector: ".calendar-day-number" }));

        expect(api.removeHoliday).toHaveBeenCalledWith("2026-03-05");
        expect(onHolidaysChange).toHaveBeenCalledWith(new Set());
    });

    it("does not add or remove a holiday when locked", async () => {
        const onHolidaysChange = vi.fn();
        renderSection({ onHolidaysChange, locked: true });
        await screen.findByText("March 2026");

        await userEvent.click(screen.getByText("5", { selector: ".calendar-day-number" }));

        expect(api.addHoliday).not.toHaveBeenCalled();
        expect(api.removeHoliday).not.toHaveBeenCalled();
        expect(onHolidaysChange).not.toHaveBeenCalled();
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
                onHolidaysChange={vi.fn()}
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
            "11 working days between 2026-03-02 and 2026-03-16",
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
