/**
 * error thrown when a change targets a locked sprint.
 */
export class SprintLockedError extends Error {}

/**
 * returns whether a sprint is locked.
 *
 * @param sprint - sprint date data with an optional end date.
 * @returns `true` when the sprint end date is before today.
 */
export function isSprintLocked(sprint: { endDate: string | null }) {
    if (sprint.endDate === null) {
        return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    return sprint.endDate < today;
}
