import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagFilter } from "./TagFilter";

const tags = [
    { id: 1, name: "checkout-web", tagType: "repo" as const },
    { id: 2, name: "urgent", tagType: "custom" as const },
];

describe("TagFilter", () => {
    it("renders the label and an 'all' option plus every tag", () => {
        render(<TagFilter tags={tags} selected="" onChange={vi.fn()} label="repo" />);
        expect(screen.getByText("repo")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "all" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "checkout-web" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "urgent" })).toBeInTheDocument();
    });

    it("reflects the selected value", () => {
        render(<TagFilter tags={tags} selected="urgent" onChange={vi.fn()} label="tag" />);
        expect(screen.getByRole("combobox")).toHaveValue("urgent");
    });

    it("calls onChange with the new value when a different option is chosen", async () => {
        const onChange = vi.fn();
        render(<TagFilter tags={tags} selected="" onChange={onChange} label="repo" />);
        await userEvent.selectOptions(screen.getByRole("combobox"), "checkout-web");
        expect(onChange).toHaveBeenCalledWith("checkout-web");
    });
});
