import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusBadge, STATUS_COLORS } from "./StatusBadge";

describe("StatusBadge", () => {
    it("renders the human label and background color for a known status", () => {
        render(<StatusBadge status="DONE" />);
        const badge = screen.getByText("done");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveStyle({ backgroundColor: STATUS_COLORS.DONE });
        expect(badge).not.toHaveClass("status-badge-muted");
    });

    it("applies the muted class when muted is set", () => {
        render(<StatusBadge status="WIP" muted />);
        expect(screen.getByText("wip")).toHaveClass("status-badge", "status-badge-muted");
    });

    it("fires onClick when clicked", async () => {
        const onClick = vi.fn();
        render(<StatusBadge status="WIP" muted onClick={onClick} />);
        await userEvent.click(screen.getByText("wip"));
        expect(onClick).toHaveBeenCalledOnce();
    });
});
