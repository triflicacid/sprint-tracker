import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import type { StatusFlowConfig } from "@shared/types";
import { FlowDiagram, type FlowEdge } from "./FlowDiagram";

const flow: StatusFlowConfig = {
    states: [
        { id: "NEW", label: "new", rank: 0, color: "#6b7280", description: "not started" },
        { id: "WIP", label: "wip", rank: 1, color: "#d95926", description: "in progress" },
        { id: "DONE", label: "done", rank: 2, color: "#008300", description: "finished" },
    ],
    transitions: [],
};

// jsdom's getBoundingClientRect always returns zeros, which would make
// every node sit at the same position and every arc a zero-length path.
// stub it to lay nodes out left-to-right so arc geometry is meaningful.
function stubNodePositions() {
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

describe("FlowDiagram", () => {
    it("renders every state as a node with its color and description tooltip", () => {
        stubNodePositions();
        const { container } = render(<FlowDiagram flow={flow} edges={[]} />);
        const nodes = container.querySelectorAll(".flow-node");
        expect(nodes).toHaveLength(3);
        expect(nodes[0]).toHaveTextContent("new");
        expect(nodes[0]).toHaveAttribute("title", "not started");
    });

    it("renders every state at full opacity when reachedStatuses is omitted", () => {
        stubNodePositions();
        const { container } = render(<FlowDiagram flow={flow} edges={[]} />);
        container.querySelectorAll(".flow-node").forEach((node) => {
            expect((node as HTMLElement).style.opacity).toBe("1");
        });
    });

    it("dims states not present in reachedStatuses", () => {
        stubNodePositions();
        const { container } = render(<FlowDiagram flow={flow} edges={[]} reachedStatuses={new Set(["NEW"])} />);
        const nodes = Array.from(container.querySelectorAll(".flow-node")) as HTMLElement[];
        expect(nodes.find((n) => n.textContent === "new")?.style.opacity).toBe("1");
        expect(nodes.find((n) => n.textContent === "wip")?.style.opacity).toBe("0.35");
    });

    it("draws one arc per edge, once node positions are known", () => {
        stubNodePositions();
        const edges: FlowEdge[] = [{ id: "e1", from: "NEW", to: "WIP", title: "new to wip" }];
        const { container } = render(<FlowDiagram flow={flow} edges={edges} />);
        const paths = container.querySelectorAll("svg.flow-arcs > path");
        expect(paths).toHaveLength(1);
        expect(paths[0].querySelector("title")?.textContent).toBe("new to wip");
    });

    it("colors the arc by the destination state's color", () => {
        stubNodePositions();
        const edges: FlowEdge[] = [{ id: "e1", from: "NEW", to: "DONE", title: "new to done" }];
        const { container } = render(<FlowDiagram flow={flow} edges={edges} />);
        const path = container.querySelector("svg.flow-arcs > path");
        expect(path).toHaveAttribute("stroke", "#008300");
    });

    it("does not draw an arc when either endpoint's position is unknown", () => {
        stubNodePositions();
        const edges: FlowEdge[] = [{ id: "e1", from: "NEW", to: "IN_PR", title: "x" }];
        const { container } = render(<FlowDiagram flow={flow} edges={edges} />);
        expect(container.querySelectorAll("svg.flow-arcs > path")).toHaveLength(0);
    });
});
