import { describe, it, expect } from "vitest";
import { statusColors, statusLabels, storyStatuses, subtaskStatuses, burndownMilestones } from "./statusCatalog.js";
import type { StatusFlowConfig } from "./types.js";

const flow: StatusFlowConfig = {
    states: [
        { id: "NEW", label: "new", rank: 0, color: "#111111", description: "", burndownMilestone: true },
        { id: "WIP", label: "wip", rank: 1, color: "#222222", description: "" },
        { id: "DONE", label: "done", rank: 2, color: "#333333", description: "", burndownMilestone: true },
    ],
    transitions: [],
};

describe("subtaskStatuses", () => {
    it("returns the state ids in flow order", () => {
        expect(subtaskStatuses(flow)).toEqual(["NEW", "WIP", "DONE"]);
    });
});

describe("storyStatuses", () => {
    it("prepends JIRA_ONLY and WORK_REMAINING to the subtask statuses", () => {
        expect(storyStatuses(flow)).toEqual(["JIRA_ONLY", "WORK_REMAINING", "NEW", "WIP", "DONE"]);
    });
});

describe("statusColors", () => {
    it("maps each state id to its configured color", () => {
        const colors = statusColors(flow);
        expect(colors.NEW).toBe("#111111");
        expect(colors.WIP).toBe("#222222");
        expect(colors.DONE).toBe("#333333");
    });

    it("includes fixed colors for the synthetic JIRA_ONLY and WORK_REMAINING statuses", () => {
        const colors = statusColors(flow);
        expect(colors.JIRA_ONLY).toBe("#6b7280");
        expect(colors.WORK_REMAINING).toBe("#8b7355");
    });
});

describe("statusLabels", () => {
    it("maps each state id to its configured label", () => {
        const labels = statusLabels(flow);
        expect(labels.NEW).toBe("new");
        expect(labels.WIP).toBe("wip");
        expect(labels.DONE).toBe("done");
    });

    it("includes fixed labels for the synthetic JIRA_ONLY and WORK_REMAINING statuses", () => {
        const labels = statusLabels(flow);
        expect(labels.JIRA_ONLY).toBe("jira only");
        expect(labels.WORK_REMAINING).toBe("work remaining");
    });
});

describe("burndownMilestones", () => {
    it("returns only the state ids flagged burndownMilestone, in rank order", () => {
        expect(burndownMilestones(flow)).toEqual(["NEW", "DONE"]);
    });

    it("returns an empty array when no state is flagged", () => {
        const noMilestones: StatusFlowConfig = {
            states: flow.states.map((state) => ({ ...state, burndownMilestone: false })),
            transitions: [],
        };
        expect(burndownMilestones(noMilestones)).toEqual([]);
    });
});
