import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusBadge, STATUS_COLORS, STATUS_LABELS } from "./StatusBadge";

describe("STATUS_COLORS / STATUS_LABELS", () => {
    it("derives every subtask status from static/statusFlow.json", () => {
        for (const id of ["NEW", "WIP", "IN_PR", "IN_REVIEW", "PR_COMMENTS", "CUT_RELEASE", "TESTING", "UAT", "DONE"]) {
            expect(STATUS_COLORS[id]).toMatch(/^#[0-9a-f]{6}$/i);
            expect(STATUS_LABELS[id]).toBeTruthy();
        }
    });

    it("includes the story-only statuses not present in the flow document", () => {
        expect(STATUS_COLORS.JIRA_ONLY).toBeDefined();
        expect(STATUS_COLORS.WORK_REMAINING).toBeDefined();
        expect(STATUS_LABELS.WORK_REMAINING).toBe("work remaining");
    });
});

describe("StatusBadge", () => {
    it("renders the human label and background color for a known status", () => {
        render(<StatusBadge status="DONE" />);
        const badge = screen.getByText("done");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveStyle({ backgroundColor: STATUS_COLORS.DONE });
        expect(badge).not.toHaveClass("status-badge-muted");
    });

    it("falls back to a lowercased raw status and default gray for an unknown status", () => {
        render(<StatusBadge status="SOMETHING_WEIRD" />);
        const badge = screen.getByText("something_weird");
        expect(badge).toHaveStyle({ backgroundColor: "#6b7280" });
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
