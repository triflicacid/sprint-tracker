import { describe, it, expect } from "vitest";
import {
    getStatusFlow,
    getAllowedNextStates,
    getRequiredFields,
    isTransitionAllowed,
    rankOf,
} from "./statusFlowService.js";

describe("getStatusFlow", () => {
    it("returns every state with a color, label and description", () => {
        const flow = getStatusFlow();
        expect(flow.states.length).toBeGreaterThan(0);
        for (const state of flow.states) {
            expect(state.color).toMatch(/^#[0-9a-f]{6}$/i);
            expect(state.label).toBeTruthy();
            expect(state.description).toBeTruthy();
        }
    });
});

describe("getAllowedNextStates", () => {
    it("lists every allowed destination from a branching state", () => {
        expect(getAllowedNextStates("IN_REVIEW")).toEqual(
            expect.arrayContaining(["PR_COMMENTS", "CUT_RELEASE", "IN_PR"])
        );
    });

    it("returns an empty list for a terminal state", () => {
        expect(getAllowedNextStates("DONE")).toEqual([]);
    });
});

describe("getRequiredFields", () => {
    it("returns the required field for a transition that needs one", () => {
        const fields = getRequiredFields("NEW", "WIP");
        expect(fields).toHaveLength(1);
        expect(fields[0]).toMatchObject({ field: "branchName", column: "subtasks.branch_name" });
    });

    it("returns an empty list for a transition that needs nothing extra", () => {
        expect(getRequiredFields("TESTING", "UAT")).toEqual([]);
    });

    it("returns an empty list for a transition pair that isn't connected", () => {
        expect(getRequiredFields("NEW", "DONE")).toEqual([]);
    });
});

describe("isTransitionAllowed", () => {
    it("allows a same-state no-op transition", () => {
        expect(isTransitionAllowed("WIP", "WIP")).toBe(true);
    });

    it("allows a real edge in the graph", () => {
        expect(isTransitionAllowed("NEW", "WIP")).toBe(true);
        expect(isTransitionAllowed("PR_COMMENTS", "IN_REVIEW")).toBe(true);
    });

    it("rejects skipping ahead in the flow", () => {
        expect(isTransitionAllowed("NEW", "DONE")).toBe(false);
        expect(isTransitionAllowed("WIP", "DONE")).toBe(false);
    });

    it("rejects moving backward outside the allowed rework edges", () => {
        expect(isTransitionAllowed("DONE", "UAT")).toBe(false);
    });
});

describe("rankOf", () => {
    it("orders states from NEW to DONE", () => {
        expect(rankOf("NEW")).toBe(0);
        expect(rankOf("DONE")).toBeGreaterThan(rankOf("TESTING"));
        expect(rankOf("TESTING")).toBeGreaterThan(rankOf("WIP"));
    });

    it("throws for an unknown status", () => {
        expect(() => rankOf("NOT_A_STATUS" as never)).toThrow(/unknown status/);
    });
});
