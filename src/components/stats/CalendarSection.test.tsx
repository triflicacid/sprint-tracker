import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { CalendarSection } from "./CalendarSection";

describe("CalendarSection", () => {
    it("renders the sprint's calendar for its date range", () => {
        render(
            <CalendarSection
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={vi.fn()}
                onExport={vi.fn()}
                loading={false}
            />
        );
        expect(screen.getByText("Calendar")).toBeInTheDocument();
        expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("calls onToggleHoliday when a calendar day is clicked", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <CalendarSection
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={onToggleHoliday}
                onExport={vi.fn()}
                loading={false}
            />
        );
        await userEvent.click(screen.getByText("5", { selector: ".calendar-day-number" }));
        expect(onToggleHoliday).toHaveBeenCalledWith("2026-03-05");
    });

    it("forwards the ref to the calendar's wrapping element, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <CalendarSection
                ref={ref}
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={vi.fn()}
                onExport={vi.fn()}
                loading={false}
            />
        );
        expect(ref.current?.textContent).toContain("March 2026");
        expect(ref.current?.textContent).not.toContain("Calendar");
    });

    it("wires up the export button", async () => {
        const onExport = vi.fn();
        render(
            <CalendarSection
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                dayActivity={{}}
                onToggleHoliday={vi.fn()}
                onExport={onExport}
                loading={false}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
    });
});
