import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SubtaskStatus, StatusFlowConfig } from "../../shared/types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// read the static flow once at startup
const config = JSON.parse(
    fs.readFileSync(path.join(currentDir, "..", "..", "static", "status_flow.json"), "utf-8")
) as StatusFlowConfig;

/**
 * returns the full status flow config.
 *
 * @returns the loaded status flow config.
 */
export function getStatusFlow() {
    return config;
}

/**
 * returns allowed next states from a status.
 *
 * @param from - current subtask status.
 * @returns allowed destination statuses.
 */
export function getAllowedNextStates(from: SubtaskStatus) {
    return config.transitions
        .filter((transition) => transition.from === from)
        .flatMap((transition) => transition.to);
}

/**
 * returns required fields for a transition.
 *
 * @param from - current subtask status.
 * @param to - requested destination status.
 * @returns required fields for the matching transition.
 */
export function getRequiredFields(from: SubtaskStatus, to: SubtaskStatus) {
    const transition = config.transitions.find(
        (entry) => entry.from === from && entry.to.includes(to)
    );
    return transition?.requires ?? [];
}

/**
 * returns whether a transition is allowed.
 *
 * @param from - current subtask status.
 * @param to - requested destination status.
 * @returns `true` when the transition is allowed.
 */
export function isTransitionAllowed(from: SubtaskStatus, to: SubtaskStatus): boolean {
    return from === to || getAllowedNextStates(from).includes(to);
}

/**
 * returns whether a status locks complexity editing.
 *
 * @param status - subtask status to inspect.
 * @returns `true` when complexity can no longer be edited.
 */
export function locksComplexityRating(status: SubtaskStatus): boolean {
    return config.states.find((entry) => entry.id === status)?.locksComplexity ?? false;
}

/**
 * returns the rank of a status.
 *
 * @param status - subtask status to rank.
 * @returns the numeric rank for the status.
 */
export function rankOf(status: SubtaskStatus) {
    const state = config.states.find((entry) => entry.id === status);
    if (!state) {
        throw new Error(`unknown status: ${status}`);
    }
    return state.rank;
}
