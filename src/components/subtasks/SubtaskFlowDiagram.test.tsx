import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import type { StatusFlowConfig, StatusHistoryEntry } from "@shared/types";
import { SubtaskFlowDiagram } from "./SubtaskFlowDiagram";

const flow: StatusFlowConfig = {
    states: [
        { id: "NEW", label: "new", rank: 0, color: "#6b7280", description: "" },
        { id: "WIP", label: "wip", rank: 1, color: "#d95926", description: "" },
        { id: "IN_REVIEW", label: "in review", rank: 2, color: "#c98500", description: "" },
        { id: "DONE", label: "done", rank: 3, color: "#008300", description: "" },
    ],
    transitions: [],
};

function stubNodePositions(): void {
    let call = 0;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        if (this.classList.contains("flow-node")) {
            const x = call * 100;
            call += 1;
            return { x, y: 0, left: x, right: x + 80, top: 0, bottom: 20, width: 80, height: 20, toJSON() {} };
        }
        return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, toJSON() {} };
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("SubtaskFlowDiagram", () => {
    it("dims states the subtask never reached", () => {
        stubNodePositions();
        const history: StatusHistoryEntry[] = [
            { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-01-01" },
            { id: 2, entityType: "subtask", entityId: 1, status: "WIP", releaseVersion: null, changedAt: "2026-01-02" },
        ];
        const { container } = render(<SubtaskFlowDiagram flow={flow} history={history} />);
        const nodes = Array.from(container.querySelectorAll(".flow-node")) as HTMLElement[];
        expect(nodes.find((n) => n.textContent === "wip")?.style.opacity).toBe("1");
        expect(nodes.find((n) => n.textContent === "done")?.style.opacity).toBe("0.35");
    });

    it("draws one arc per real consecutive transition, skipping states along the allowed graph that weren't visited", () => {
        stubNodePositions();
        const history: StatusHistoryEntry[] = [
            { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-01-01" },
            { id: 2, entityType: "subtask", entityId: 1, status: "WIP", releaseVersion: null, changedAt: "2026-01-02" },
            { id: 3, entityType: "subtask", entityId: 1, status: "DONE", releaseVersion: null, changedAt: "2026-01-05" },
        ];
        const { container } = render(<SubtaskFlowDiagram flow={flow} history={history} />);
        const arcs = container.querySelectorAll("svg.flow-arcs > path");
        expect(arcs).toHaveLength(2);
        const titles = Array.from(arcs).map((arc) => arc.querySelector("title")?.textContent);
        expect(titles).toEqual(["new → wip on 2026-01-02", "wip → done on 2026-01-05"]);
    });

    it("skips a repeated identical status entry (no-op transition) without drawing a self-arc", () => {
        stubNodePositions();
        const history: StatusHistoryEntry[] = [
            { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-01-01" },
            { id: 2, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-01-01" },
        ];
        const { container } = render(<SubtaskFlowDiagram flow={flow} history={history} />);
        expect(container.querySelectorAll("svg.flow-arcs > path")).toHaveLength(0);
    });

    it("draws history out of insertion order by sorting on changedAt first", () => {
        stubNodePositions();
        const history: StatusHistoryEntry[] = [
            { id: 2, entityType: "subtask", entityId: 1, status: "WIP", releaseVersion: null, changedAt: "2026-01-02" },
            { id: 1, entityType: "subtask", entityId: 1, status: "NEW", releaseVersion: null, changedAt: "2026-01-01" },
        ];
        const { container } = render(<SubtaskFlowDiagram flow={flow} history={history} />);
        const arc = container.querySelector("svg.flow-arcs > path");
        expect(arc?.querySelector("title")?.textContent).toBe("new → wip on 2026-01-02");
    });
});
