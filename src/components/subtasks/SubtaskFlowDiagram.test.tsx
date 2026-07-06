import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { StatusHistoryEntry } from "@shared/types";
import { SubtaskFlowDiagram } from "./SubtaskFlowDiagram";

function entry(id: number, status: string, changedAt: string): StatusHistoryEntry {
    return { id, entityType: "subtask", entityId: 1, status, releaseVersion: null, changedAt };
}

describe("SubtaskFlowDiagram", () => {
    it("shows a placeholder when there is no history yet", () => {
        render(<SubtaskFlowDiagram history={[]} />);
        expect(screen.getByText("not started yet.")).toBeInTheDocument();
    });

    it("draws one lozenge per transition, in order", () => {
        const history: StatusHistoryEntry[] = [
            entry(1, "NEW", "2026-01-01"),
            entry(2, "WIP", "2026-01-02"),
            entry(3, "DONE", "2026-01-05"),
        ];
        const { container } = render(<SubtaskFlowDiagram history={history} />);
        const nodes = container.querySelectorAll(".flow-node");
        expect(Array.from(nodes).map((n) => n.textContent)).toEqual(["new", "wip", "done"]);
    });

    it("draws revisiting an earlier status as a brand new lozenge, not a shared/looping node", () => {
        const history: StatusHistoryEntry[] = [
            entry(1, "NEW", "2026-01-01"),
            entry(2, "WIP", "2026-01-02"),
            entry(3, "IN_REVIEW", "2026-01-03"),
            entry(4, "PR_COMMENTS", "2026-01-04"),
            entry(5, "IN_REVIEW", "2026-01-05"),
            entry(6, "CUT_RELEASE", "2026-01-06"),
        ];
        const { container } = render(<SubtaskFlowDiagram history={history} />);
        const nodes = container.querySelectorAll(".flow-node");
        // "in review" appears twice, as two distinct lozenges - not deduped
        // into one shared node.
        expect(Array.from(nodes).map((n) => n.textContent)).toEqual([
            "new",
            "wip",
            "in review",
            "pr comments",
            "in review",
            "cut release",
        ]);
        expect(container.querySelectorAll(".flow-chain-arrow")).toHaveLength(5);
    });

    it("collapses a genuine no-op (two consecutive identical statuses) into a single lozenge", () => {
        const history: StatusHistoryEntry[] = [entry(1, "NEW", "2026-01-01"), entry(2, "NEW", "2026-01-01")];
        const { container } = render(<SubtaskFlowDiagram history={history} />);
        expect(container.querySelectorAll(".flow-node")).toHaveLength(1);
    });

    it("draws history out of insertion order by sorting on changedAt first", () => {
        const history: StatusHistoryEntry[] = [entry(2, "WIP", "2026-01-02"), entry(1, "NEW", "2026-01-01")];
        const { container } = render(<SubtaskFlowDiagram history={history} />);
        const nodes = container.querySelectorAll(".flow-node");
        expect(Array.from(nodes).map((n) => n.textContent)).toEqual(["new", "wip"]);
    });

    it("puts the transition's date/time in each lozenge's title", () => {
        const history: StatusHistoryEntry[] = [entry(1, "NEW", "2026-01-01 09:15:00")];
        const { container } = render(<SubtaskFlowDiagram history={history} />);
        expect(container.querySelector(".flow-node")).toHaveAttribute("title", "2026-01-01 09:15 — new");
    });
});
