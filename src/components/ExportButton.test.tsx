import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportButton } from "./ExportButton";

describe("ExportButton", () => {
    it("shows the default label and calls onClick when clicked", async () => {
        const onClick = vi.fn();
        render(<ExportButton onClick={onClick} loading={false} />);
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it("shows the loading label and disables the button while loading", () => {
        render(<ExportButton onClick={vi.fn()} loading />);
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();
    });

    it("supports custom label/loadingLabel text", () => {
        render(<ExportButton onClick={vi.fn()} loading={false} label="generate export" loadingLabel="generating..." />);
        expect(screen.getByRole("button", { name: "generate export" })).toBeInTheDocument();
    });

    it("is disabled when disabled is set, independent of loading", () => {
        render(<ExportButton onClick={vi.fn()} loading={false} disabled />);
        expect(screen.getByRole("button", { name: "export pdf" })).toBeDisabled();
    });

    it("does not call onClick when disabled", async () => {
        const onClick = vi.fn();
        render(<ExportButton onClick={onClick} loading={false} disabled />);
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onClick).not.toHaveBeenCalled();
    });

    it("is enabled by default when neither loading nor disabled is set", () => {
        render(<ExportButton onClick={vi.fn()} loading={false} />);
        expect(screen.getByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
