import type { StatusFlowConfig, StoryStatus, SubtaskStatus } from "./types.js";

const JIRA_ONLY_COLOR = "#6b7280";
const WORK_REMAINING_COLOR = "#8b7355";
const JIRA_ONLY_LABEL = "jira only";
const WORK_REMAINING_LABEL = "work remaining";

/**
 * returns subtask statuses in flow order.
 *
 * @param flow - status flow configuration.
 * @returns the ordered subtask status ids.
 */
export function subtaskStatuses(flow: StatusFlowConfig): SubtaskStatus[] {
    return flow.states.map((state) => state.id);
}

/**
 * returns burndown milestone statuses in flow order.
 *
 * @param flow - status flow configuration.
 * @returns the status ids flagged as burndown milestones.
 */
export function burndownMilestones(flow: StatusFlowConfig): SubtaskStatus[] {
    return flow.states.filter((state) => state.burndownMilestone).map((state) => state.id);
}

/**
 * returns story statuses for the flow.
 *
 * @param flow - status flow configuration.
 * @returns synthetic story statuses followed by subtask statuses.
 */
export function storyStatuses(flow: StatusFlowConfig): StoryStatus[] {
    return ["JIRA_ONLY", "WORK_REMAINING", ...subtaskStatuses(flow)];
}

/**
 * returns display colors for all story statuses.
 *
 * @param flow - status flow configuration.
 * @returns a color map keyed by story status.
 */
export function statusColors(flow: StatusFlowConfig): Record<StoryStatus, string> {
    return {
        ...(Object.fromEntries(flow.states.map((state) => [state.id, state.color])) as Record<SubtaskStatus, string>),
        JIRA_ONLY: JIRA_ONLY_COLOR,
        WORK_REMAINING: WORK_REMAINING_COLOR,
    };
}

/**
 * returns display labels for all story statuses.
 *
 * @param flow - status flow configuration.
 * @returns a label map keyed by story status.
 */
export function statusLabels(flow: StatusFlowConfig): Record<StoryStatus, string> {
    return {
        ...(Object.fromEntries(flow.states.map((state) => [state.id, state.label])) as Record<SubtaskStatus, string>),
        JIRA_ONLY: JIRA_ONLY_LABEL,
        WORK_REMAINING: WORK_REMAINING_LABEL,
    };
}
