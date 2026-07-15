import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RatingSelect } from "./RatingSelect";

describe("RatingSelect", () => {
    it("renders the label and a blank option plus every option", () => {
        render(<RatingSelect label="complexity:" value={null} options={[1, 2, 3, 4, 5]} onChange={vi.fn()} />);
        expect(screen.getByText("complexity:")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "-" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "3" })).toBeInTheDocument();
    });

    it("reflects the current value", () => {
        render(<RatingSelect label="story points:" value={5} options={[1, 2, 3, 5, 8, 13]} onChange={vi.fn()} />);
        expect(screen.getByRole("combobox")).toHaveValue("5");
    });

    it("shows the blank option selected when value is null", () => {
        render(<RatingSelect label="story points:" value={null} options={[1, 2, 3, 5, 8, 13]} onChange={vi.fn()} />);
        expect(screen.getByRole("combobox")).toHaveValue("");
    });

    it("calls onChange with the raw string value of the chosen option", async () => {
        const onChange = vi.fn();
        render(<RatingSelect label="complexity:" value={null} options={[1, 2, 3, 4, 5]} onChange={onChange} />);
        await userEvent.selectOptions(screen.getByRole("combobox"), "4");
        expect(onChange).toHaveBeenCalledWith("4");
    });

    it("calls onChange with an empty string when the blank option is chosen", async () => {
        const onChange = vi.fn();
        render(<RatingSelect label="complexity:" value={3} options={[1, 2, 3, 4, 5]} onChange={onChange} />);
        await userEvent.selectOptions(screen.getByRole("combobox"), "-");
        expect(onChange).toHaveBeenCalledWith("");
    });

    it("disables the select and applies the title when disabled", () => {
        render(
            <RatingSelect
                label="complexity:"
                value={3}
                options={[1, 2, 3, 4, 5]}
                onChange={vi.fn()}
                disabled
                title="locked"
            />
        );
        expect(screen.getByRole("combobox")).toBeDisabled();
        expect(screen.getByRole("combobox")).toHaveAttribute("title", "locked");
    });

    it("leaves the select enabled when disabled is not set", () => {
        render(<RatingSelect label="story points:" value={null} options={[1, 2, 3, 5, 8, 13]} onChange={vi.fn()} />);
        expect(screen.getByRole("combobox")).toBeEnabled();
    });

    it("renders the value as plain text and no select when readOnly", () => {
        render(<RatingSelect label="story points:" value={5} options={[1, 2, 3, 5, 8, 13]} onChange={vi.fn()} readOnly />);
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        expect(screen.getByText(/story points: 5/)).toBeInTheDocument();
    });

    it("shows a dash for a null value when readOnly", () => {
        render(<RatingSelect label="story points:" value={null} options={[1, 2, 3, 5, 8, 13]} onChange={vi.fn()} readOnly />);
        expect(screen.getByText(/story points: -/)).toBeInTheDocument();
    });

    it("applies an extra selectClassName for site-specific targeting", () => {
        render(
            <RatingSelect
                label="complexity:"
                value={null}
                options={[1, 2, 3, 4, 5]}
                onChange={vi.fn()}
                selectClassName="complexity-select"
            />
        );
        expect(screen.getByRole("combobox")).toHaveClass("complexity-select");
    });
});
