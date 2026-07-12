export class SprintLockedError extends Error {}

// a sprint is locked once its end date has strictly passed; a sprint ending
// today is still editable until the day rolls over.
export function isSprintLocked(sprint: { endDate: string | null }): boolean {
    if (sprint.endDate === null) {
        return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    return sprint.endDate < today;
}
