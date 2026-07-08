import type { StatusFlowConfig, StoryStatus, SubtaskStatus } from "./types.js";

const JIRA_ONLY_COLOR = "#6b7280";
const WORK_REMAINING_COLOR = "#8b7355";
const JIRA_ONLY_LABEL = "jira only";
const WORK_REMAINING_LABEL = "work remaining";

export function subtaskStatuses(flow: StatusFlowConfig): SubtaskStatus[] {
    return flow.states.map((state) => state.id);
}

// states flagged as checkpoints for the advanced burndown chart, in rank order.
export function burndownMilestones(flow: StatusFlowConfig): SubtaskStatus[] {
    return flow.states.filter((state) => state.burndownMilestone).map((state) => state.id);
}

// story statuses = the synthetic JIRA_ONLY/WORK_REMAINING states, followed by
// every subtask status.
export function storyStatuses(flow: StatusFlowConfig): StoryStatus[] {
    return ["JIRA_ONLY", "WORK_REMAINING", ...subtaskStatuses(flow)];
}

export function statusColors(flow: StatusFlowConfig): Record<StoryStatus, string> {
    return {
        ...(Object.fromEntries(flow.states.map((state) => [state.id, state.color])) as Record<SubtaskStatus, string>),
        JIRA_ONLY: JIRA_ONLY_COLOR,
        WORK_REMAINING: WORK_REMAINING_COLOR,
    };
}

export function statusLabels(flow: StatusFlowConfig): Record<StoryStatus, string> {
    return {
        ...(Object.fromEntries(flow.states.map((state) => [state.id, state.label])) as Record<SubtaskStatus, string>),
        JIRA_ONLY: JIRA_ONLY_LABEL,
        WORK_REMAINING: WORK_REMAINING_LABEL,
    };
}
