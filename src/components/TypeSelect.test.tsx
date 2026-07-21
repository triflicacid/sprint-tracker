import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TypeSelect, type TypeSelectOption } from "./TypeSelect";

const options: TypeSelectOption[] = [
    { value: "alpha", label: "Alpha", icon: <span data-testid="icon-alpha">A</span> },
    { value: "beta", label: "Beta", icon: <span data-testid="icon-beta">B</span>, group: "tier-1" },
    { value: "gamma", label: "Gamma", icon: <span data-testid="icon-gamma">G</span>, group: "tier-1" },
    { value: "delta", label: "Delta", icon: <span data-testid="icon-delta">D</span>, group: "tier-2" },
];

describe("TypeSelect", () => {
    it("shows the current selection's label on the trigger, closed by default", () => {
        render(<TypeSelect value="alpha" options={options} onChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("reflects a different initial selection", () => {
        render(<TypeSelect value="beta" options={options} onChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument();
    });

    it("opens a listbox with all options when the trigger is clicked", async () => {
        render(<TypeSelect value="alpha" options={options} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Beta" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Gamma" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Delta" })).toBeInTheDocument();
    });

    it("marks the current value as selected, others as not selected", async () => {
        render(<TypeSelect value="beta" options={options} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Beta" }));
        expect(screen.getByRole("option", { name: "Beta" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute("aria-selected", "false");
    });

    it("calls onChange with the chosen value and closes the listbox", async () => {
        const onChange = vi.fn();
        render(<TypeSelect value="alpha" options={options} onChange={onChange} />);
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        await userEvent.click(screen.getByRole("option", { name: "Beta" }));
        expect(onChange).toHaveBeenCalledWith("beta");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("closes without calling onChange when clicking outside the dropdown", async () => {
        const onChange = vi.fn();
        render(
            <div>
                <TypeSelect value="alpha" options={options} onChange={onChange} />
                <button>elsewhere</button>
            </div>
        );
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "elsewhere" }));
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("closes on Escape key", async () => {
        render(<TypeSelect value="alpha" options={options} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        await userEvent.keyboard("{Escape}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("renders group labels as separators between groups", async () => {
        render(<TypeSelect value="alpha" options={options} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.getByText("tier-1")).toBeInTheDocument();
        expect(screen.getByText("tier-2")).toBeInTheDocument();
    });

    it("shows the group label only once even when multiple options share it", async () => {
        render(<TypeSelect value="alpha" options={options} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.getAllByText("tier-1")).toHaveLength(1);
    });

    it("toggles the listbox closed when the trigger is clicked a second time", async () => {
        render(<TypeSelect value="alpha" options={options} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
});

