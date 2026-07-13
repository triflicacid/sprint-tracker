export class SprintLockedError extends Error {}

// a sprint is locked once its end date has strictly passed
export function isSprintLocked(sprint: { endDate: string | null }) {
    if (sprint.endDate === null) {
        return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    return sprint.endDate < today;
}
