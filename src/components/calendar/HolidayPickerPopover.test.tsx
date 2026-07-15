import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HolidayPickerPopover } from "./HolidayPickerPopover";

describe("HolidayPickerPopover", () => {
    it("opens the month grid on trigger click", async () => {
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onToggleHoliday={vi.fn()}
            />
        );
        expect(screen.queryByText("March 2026")).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));

        expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("closes on outside click", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <div>
                <HolidayPickerPopover
                    startDate="2026-03-02"
                    endDate="2026-03-16"
                    holidays={new Set()}
                    onToggleHoliday={onToggleHoliday}
                />
                <button>elsewhere</button>
            </div>
        );

        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));
        expect(screen.getByText("March 2026")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "elsewhere" }));

        expect(screen.queryByText("March 2026")).not.toBeInTheDocument();
        expect(onToggleHoliday).not.toHaveBeenCalled();
    });

    it("closes on escape", async () => {
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onToggleHoliday={vi.fn()}
            />
        );

        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));
        expect(screen.getByText("March 2026")).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");

        expect(screen.queryByText("March 2026")).not.toBeInTheDocument();
    });

    it("toggles a holiday on and stays open", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onToggleHoliday={onToggleHoliday}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));

        await userEvent.click(screen.getByText("5"));

        expect(onToggleHoliday).toHaveBeenCalledWith("2026-03-05");
        expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("toggles an existing holiday off", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set(["2026-03-05"])}
                onToggleHoliday={onToggleHoliday}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));

        await userEvent.click(screen.getByText("5"));

        expect(onToggleHoliday).toHaveBeenCalledWith("2026-03-05");
    });

    it("does not toggle weekends", async () => {
        const onToggleHoliday = vi.fn();
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onToggleHoliday={onToggleHoliday}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));

        // March 7 2026 is a Saturday, within the sprint range.
        const day = screen.getByText("7").closest(".calendar-day") as HTMLElement;
        expect(day).not.toHaveAttribute("title");
        await userEvent.click(day);

        expect(onToggleHoliday).not.toHaveBeenCalled();
    });

    it("shows one month at a time, with both chevrons disabled when the sprint fits in a single month", async () => {
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onToggleHoliday={vi.fn()}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));

        expect(screen.getByRole("button", { name: "previous month" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "next month" })).toBeDisabled();
    });

    it("navigates between months for a sprint spanning more than one, clamped to its range", async () => {
        render(
            <HolidayPickerPopover
                startDate="2026-03-20"
                endDate="2026-05-10"
                holidays={new Set()}
                onToggleHoliday={vi.fn()}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "edit holidays" }));
        expect(screen.getByText("March 2026")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "previous month" })).toBeDisabled();

        await userEvent.click(screen.getByRole("button", { name: "next month" }));
        expect(screen.getByText("April 2026")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "previous month" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "next month" })).toBeEnabled();

        await userEvent.click(screen.getByRole("button", { name: "next month" }));
        expect(screen.getByText("May 2026")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "next month" })).toBeDisabled();
    });

    it("renders nothing when locked", () => {
        render(
            <HolidayPickerPopover
                startDate="2026-03-02"
                endDate="2026-03-16"
                holidays={new Set()}
                onToggleHoliday={vi.fn()}
                locked
            />
        );
        expect(screen.queryByRole("button", { name: "edit holidays" })).not.toBeInTheDocument();
    });
});
