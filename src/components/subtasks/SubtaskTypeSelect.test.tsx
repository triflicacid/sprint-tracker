import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubtaskTypeEntry } from "@shared/types";
import { SubtaskTypeSelect } from "./SubtaskTypeSelect";

const types: SubtaskTypeEntry[] = [
    { shortName: "feature", fullName: "Feature", description: "New user-facing functionality.", tier: "basic" },
    { shortName: "bugfix", fullName: "Bugfix", description: "Fixes broken behavior.", tier: "basic" },
    { shortName: "spike", fullName: "Spike", description: "Investigation.", tier: "basic" },
    { shortName: "chore", fullName: "Chore", description: "Routine upkeep.", tier: "advanced" },
];

describe("SubtaskTypeSelect", () => {
    it("shows the current value's full name on the trigger, closed by default", () => {
        render(<SubtaskTypeSelect value="feature" options={types} onChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: "Feature" })).toBeInTheDocument();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("shows an icon in the trigger for the selected type", () => {
        render(<SubtaskTypeSelect value="feature" options={types} onChange={vi.fn()} />);
        expect(document.querySelector("svg.subtask-type-icon")).not.toBeNull();
    });

    it("opens a listbox with all options when clicked", async () => {
        render(<SubtaskTypeSelect value="feature" options={types} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Feature" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Feature" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Bugfix" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Chore" })).toBeInTheDocument();
    });

    it("calls onChange with the shortName when an option is selected", async () => {
        const onChange = vi.fn();
        render(<SubtaskTypeSelect value="feature" options={types} onChange={onChange} />);
        await userEvent.click(screen.getByRole("button", { name: "Feature" }));
        await userEvent.click(screen.getByRole("option", { name: "Bugfix" }));
        expect(onChange).toHaveBeenCalledWith("bugfix");
    });

    it("closes the listbox after a selection", async () => {
        render(<SubtaskTypeSelect value="feature" options={types} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Feature" }));
        await userEvent.click(screen.getByRole("option", { name: "Spike" }));
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("groups options by their tier", async () => {
        render(<SubtaskTypeSelect value="feature" options={types} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Feature" }));
        expect(screen.getByText("basic")).toBeInTheDocument();
        expect(screen.getByText("advanced")).toBeInTheDocument();
    });

    it("closes on Escape", async () => {
        render(<SubtaskTypeSelect value="feature" options={types} onChange={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "Feature" }));
        await userEvent.keyboard("{Escape}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
});

