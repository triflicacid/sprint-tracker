import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoryTypeSelect } from "./StoryTypeSelect";

describe("StoryTypeSelect", () => {
    it("shows the current selection's icon and label on the trigger, closed by default", () => {
        render(<StoryTypeSelect isBug={false} onChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: "story" })).toBeInTheDocument();
        expect(document.querySelector("svg.story-type-icon title")?.textContent).toBe("story");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("reflects a bug selection on the trigger", () => {
        render(<StoryTypeSelect isBug={true} onChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: "bug" })).toBeInTheDocument();
        expect(document.querySelector("svg.story-type-icon title")?.textContent).toBe("bug");
    });

    it("opens a listbox with both options, each carrying its own icon, when the trigger is clicked", async () => {
        render(<StoryTypeSelect isBug={false} onChange={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "story" }));

        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "story" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("option", { name: "bug" })).toHaveAttribute("aria-selected", "false");
    });

    it("calls onChange and closes the listbox when an option is picked", async () => {
        const onChange = vi.fn();
        render(<StoryTypeSelect isBug={false} onChange={onChange} />);

        await userEvent.click(screen.getByRole("button", { name: "story" }));
        await userEvent.click(screen.getByRole("option", { name: "bug" }));

        expect(onChange).toHaveBeenCalledWith(true);
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("closes without calling onChange when clicking outside the dropdown", async () => {
        const onChange = vi.fn();
        render(
            <div>
                <StoryTypeSelect isBug={false} onChange={onChange} />
                <button>elsewhere</button>
            </div>
        );

        await userEvent.click(screen.getByRole("button", { name: "story" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "elsewhere" }));

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("closes on escape", async () => {
        render(<StoryTypeSelect isBug={false} onChange={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "story" }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
});
