import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SubtaskStatus, FlowField, StatusFlowConfig } from "../../shared/types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// only read the static flow file once on startup
const config = JSON.parse(
    fs.readFileSync(path.join(currentDir, "..", "..", "static", "statusFlow.json"), "utf-8")
) as StatusFlowConfig;

export function getStatusFlow() {
    return config;
}

// return all permissable states that we can transition to
export function getAllowedNextStates(from: SubtaskStatus) {
    return config.transitions
        .filter((transition) => transition.from === from)
        .flatMap((transition) => transition.to);
}

// when taking the given transition, return any fields which are required
export function getRequiredFields(from: SubtaskStatus, to: SubtaskStatus) {
    const transition = config.transitions.find(
        (entry) => entry.from === from && entry.to.includes(to)
    );
    return transition?.requires ?? [];
}

export function isTransitionAllowed(from: SubtaskStatus, to: SubtaskStatus): boolean {
    return from === to || getAllowedNextStates(from).includes(to);
}

// once a subtask is in a "locksComplexity" state, its complexity rating can
// no longer be edited
export function locksComplexityRating(status: SubtaskStatus): boolean {
    return config.states.find((entry) => entry.id === status)?.locksComplexity ?? false;
}

// the rank of a status is used to determine the status of a collection of statuses
export function rankOf(status: SubtaskStatus) {
    const state = config.states.find((entry) => entry.id === status);
    if (!state) {
        throw new Error(`unknown status: ${status}`);
    }
    return state.rank;
}
