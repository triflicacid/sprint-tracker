import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchableInput } from "./SearchableInput";

describe("SearchableInput", () => {
    const mockOnClick = vi.fn();
    const mockOnChange = vi.fn();
    const suggestions = ["Nebula Checkout Platform", "Platform Hardening", "Refund Management", "Quick T-Plan"];

    beforeEach(() => {
        mockOnClick.mockReset();
        mockOnChange.mockReset();
    });

    it("renders input with provided initial value", () => {
        render(
            <SearchableInput
                initialValue="Test Project"
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        expect(input).toHaveValue("Test Project");
    });

    it("renders input with placeholder when provided", () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
                placeholder="project (optional)"
            />
        );

        expect(screen.getByPlaceholderText("project (optional)")).toBeInTheDocument();
    });

    it("typing updates the input value and calls onChange with new value", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.type(input, "Platform");

        expect(input).toHaveValue("Platform");
        expect(mockOnChange).toHaveBeenCalledTimes(8); // once per character
        expect(mockOnChange).toHaveBeenLastCalledWith("Platform");
    });

    it("shows all suggestions when focused and input is empty", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByText("Nebula Checkout Platform")).toBeInTheDocument();
        expect(screen.getByText("Platform Hardening")).toBeInTheDocument();
        expect(screen.getByText("Refund Management")).toBeInTheDocument();
        expect(screen.getByText("Quick T-Plan")).toBeInTheDocument();
    });

    it("filters suggestions based on input text (substring matching, case-insensitive)", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.type(input, "platform");

        expect(screen.getByText("Nebula Checkout Platform")).toBeInTheDocument();
        expect(screen.getByText("Platform Hardening")).toBeInTheDocument();
        expect(screen.queryByText("Refund Management")).not.toBeInTheDocument();
        expect(screen.queryByText("Quick T-Plan")).not.toBeInTheDocument();
    });

    it("shows filtered suggestions even when input is not empty (as long as matches exist)", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.type(input, "Refund");

        // Dropdown should be open with matching suggestion
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByText("Refund Management")).toBeInTheDocument();
        expect(screen.queryByText("Platform Hardening")).not.toBeInTheDocument();
    });

    it("hides dropdown when no suggestions match", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.type(input, "xyz");

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("clicking suggestion calls both onChange and onClick with the selected value", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        mockOnChange.mockReset(); // Clear previous onChange calls from typing

        await userEvent.click(screen.getByText("Platform Hardening"));

        expect(mockOnChange).toHaveBeenCalledWith("Platform Hardening");
        expect(mockOnClick).toHaveBeenCalledWith("Platform Hardening");
    });

    it("clicking suggestion updates input value", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);
        await userEvent.click(screen.getByText("Refund Management"));

        expect(input).toHaveValue("Refund Management");
    });

    it("clicking suggestion closes dropdown", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        expect(screen.getByRole("listbox")).toBeInTheDocument();

        await userEvent.click(screen.getByText("Quick T-Plan"));

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("escape key closes dropdown", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        expect(screen.getByRole("listbox")).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("arrow down key highlights first suggestion", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);
        await userEvent.keyboard("{ArrowDown}");

        const firstOption = screen.getByText("Nebula Checkout Platform");
        expect(firstOption.closest("li")).toHaveClass("selected");
    });

    it("arrow keys navigate through suggestions", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        // Navigate down
        await userEvent.keyboard("{ArrowDown}");
        expect(screen.getByText("Nebula Checkout Platform").closest("li")).toHaveClass("selected");

        await userEvent.keyboard("{ArrowDown}");
        expect(screen.getByText("Platform Hardening").closest("li")).toHaveClass("selected");

        // Navigate up
        await userEvent.keyboard("{ArrowUp}");
        expect(screen.getByText("Nebula Checkout Platform").closest("li")).toHaveClass("selected");
    });

    it("enter key selects highlighted suggestion and calls both onChange and onClick", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        mockOnChange.mockReset(); // Clear previous calls

        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{Enter}");

        expect(input).toHaveValue("Nebula Checkout Platform");
        expect(mockOnChange).toHaveBeenCalledWith("Nebula Checkout Platform");
        expect(mockOnClick).toHaveBeenCalledWith("Nebula Checkout Platform");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("enter key with no selection does nothing", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        mockOnChange.mockReset();
        mockOnClick.mockReset();

        await userEvent.keyboard("{Enter}");

        expect(mockOnChange).not.toHaveBeenCalled();
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("clicking outside closes dropdown", async () => {
        render(
            <div>
                <SearchableInput
                    initialValue=""
                    onClick={mockOnClick}
                    onChange={mockOnChange}
                    suggestions={suggestions}
                />
                <button>Outside</button>
            </div>
        );

        const input = screen.getByRole("combobox");
        await userEvent.click(input);

        expect(screen.getByRole("listbox")).toBeInTheDocument();

        await userEvent.click(screen.getByText("Outside"));

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("applies custom className when provided", () => {
        const { container } = render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
                className="custom-class"
            />
        );

        expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("reopens dropdown with arrow keys when closed", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");

        // Dropdown starts closed when not focused
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

        // Arrow down should open it
        input.focus();
        await userEvent.keyboard("{ArrowDown}");

        expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("filters suggestions continuously as user types", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        await userEvent.type(input, "Pl");

        // Should show both Platform options
        expect(screen.getByText("Nebula Checkout Platform")).toBeInTheDocument();
        expect(screen.getByText("Platform Hardening")).toBeInTheDocument();

        await userEvent.type(input, "atform Hard");

        // Should now only show Platform Hardening
        expect(screen.queryByText("Nebula Checkout Platform")).not.toBeInTheDocument();
        expect(screen.getByText("Platform Hardening")).toBeInTheDocument();
    });

    it("updates internal value when initialValue prop changes", () => {
        const { rerender } = render(
            <SearchableInput
                initialValue="First"
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        expect(screen.getByRole("combobox")).toHaveValue("First");

        rerender(
            <SearchableInput
                initialValue="Second"
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        expect(screen.getByRole("combobox")).toHaveValue("Second");
    });

    it("has proper ARIA attributes", () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        expect(input).toHaveAttribute("aria-expanded", "false");
        expect(input).toHaveAttribute("aria-autocomplete", "list");
        expect(input).toHaveAttribute("aria-controls", "searchable-input-listbox");
    });

    it("updates aria-expanded when dropdown opens", async () => {
        render(
            <SearchableInput
                initialValue=""
                onClick={mockOnClick}
                onChange={mockOnChange}
                suggestions={suggestions}
            />
        );

        const input = screen.getByRole("combobox");
        expect(input).toHaveAttribute("aria-expanded", "false");

        await userEvent.click(input);

        expect(input).toHaveAttribute("aria-expanded", "true");
    });
});

