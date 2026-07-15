import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePickerPopover } from "./DatePickerPopover";

describe("DatePickerPopover", () => {
    it("shows a placeholder when no date is selected", () => {
        render(<DatePickerPopover label="from" value="" onSelect={vi.fn()} />);
        expect(screen.getByRole("button", { name: "select from date" })).toBeInTheDocument();
    });

    it("shows the selected date", () => {
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={vi.fn()} />);
        expect(screen.getByRole("button", { name: "2026-03-05" })).toBeInTheDocument();
    });

    it("opens on the selected month", async () => {
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "2026-03-05" }));
        expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("selects a day and closes the popover", async () => {
        const onSelect = vi.fn();
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={onSelect} />);
        await userEvent.click(screen.getByRole("button", { name: "2026-03-05" }));

        await userEvent.click(screen.getByText("12"));

        expect(onSelect).toHaveBeenCalledWith("2026-03-12");
        expect(screen.queryByText("March 2026")).not.toBeInTheDocument();
    });

    it("selects a weekend day", async () => {
        const onSelect = vi.fn();
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={onSelect} />);
        await userEvent.click(screen.getByRole("button", { name: "2026-03-05" }));

        // March 7 2026 is a Saturday.
        await userEvent.click(screen.getByText("7"));

        expect(onSelect).toHaveBeenCalledWith("2026-03-07");
    });

    it("navigates months", async () => {
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "2026-03-05" }));
        expect(screen.getByText("March 2026")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "next month" }));
        expect(screen.getByText("April 2026")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "previous month" }));
        await userEvent.click(screen.getByRole("button", { name: "previous month" }));
        expect(screen.getByText("February 2026")).toBeInTheDocument();
    });

    it("jumps to a chosen month and year", async () => {
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "2026-03-05" }));

        await userEvent.selectOptions(screen.getByRole("combobox", { name: "month" }), "May");
        await userEvent.clear(screen.getByRole("spinbutton", { name: "year" }));
        await userEvent.type(screen.getByRole("spinbutton", { name: "year" }), "2031");

        expect(screen.getByText("May 2031")).toBeInTheDocument();
    });

    it("closes on escape", async () => {
        const onSelect = vi.fn();
        render(<DatePickerPopover label="from" value="2026-03-05" onSelect={onSelect} />);
        await userEvent.click(screen.getByRole("button", { name: "2026-03-05" }));
        expect(screen.getByText("March 2026")).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");

        expect(screen.queryByText("March 2026")).not.toBeInTheDocument();
        expect(onSelect).not.toHaveBeenCalled();
    });
});
