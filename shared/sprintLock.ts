/**
 * error thrown when a change targets a locked sprint.
 */
export class SprintLockedError extends Error {}

/**
 * error thrown when a change targets a manually locked story or subtask.
 */
export class ManualLockError extends Error {}

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

/**
 * returns a story's effective lock state.
 *
 * @param sprint - parent sprint end date.
 * @param story - story's own manual lock flag.
 * @returns `true` when the sprint has ended or the story is manually locked.
 */
export function isStoryEffectivelyLocked(sprint: { endDate: string | null }, story: { locked: boolean }) {
    return isSprintLocked(sprint) || story.locked;
}

/**
 * returns a subtask's effective lock state.
 *
 * @param sprint - parent sprint end date.
 * @param story - parent story's manual lock flag (cascades to the subtask).
 * @param subtask - subtask's own manual lock flag.
 * @returns `true` when the sprint has ended, the parent story is manually locked, or the subtask itself is.
 */
export function isSubtaskEffectivelyLocked(
    sprint: { endDate: string | null },
    story: { locked: boolean },
    subtask: { locked: boolean }
) {
    return isSprintLocked(sprint) || story.locked || subtask.locked;
}
