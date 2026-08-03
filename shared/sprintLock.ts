/**
 * error thrown when a change targets a locked sprint.
 */
export class SprintLockedError extends Error {}

/**
 * error thrown when a change targets a manually locked sprint, story, or subtask.
 */
export class ManualLockError extends Error {}

/**
 * returns whether a sprint's end date has passed.
 *
 * this is the permanent, date-based lock - distinct from a sprint's own reversible manual lock
 * flag, which is folded in separately by {@link isSprintEffectivelyLocked}.
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
 * returns a sprint's effective lock state.
 *
 * @param sprint - sprint end date and its own manual lock flag.
 * @returns `true` when the sprint's end date has passed or it is manually locked.
 */
export function isSprintEffectivelyLocked(sprint: { endDate: string | null; locked: boolean }) {
    return isSprintLocked(sprint) || sprint.locked;
}

/**
 * returns a story's effective lock state.
 *
 * @param sprint - parent sprint end date and its own manual lock flag (cascades to the story).
 * @param story - story's own manual lock flag.
 * @returns `true` when the sprint is effectively locked or the story is manually locked.
 */
export function isStoryEffectivelyLocked(
    sprint: { endDate: string | null; locked: boolean },
    story: { locked: boolean }
) {
    return isSprintEffectivelyLocked(sprint) || story.locked;
}

/**
 * returns a subtask's effective lock state.
 *
 * @param sprint - parent sprint end date and its own manual lock flag (cascades to the subtask).
 * @param story - parent story's manual lock flag (cascades to the subtask).
 * @param subtask - subtask's own manual lock flag.
 * @returns `true` when the sprint is effectively locked, the parent story is manually locked, or the subtask itself is.
 */
export function isSubtaskEffectivelyLocked(
    sprint: { endDate: string | null; locked: boolean },
    story: { locked: boolean },
    subtask: { locked: boolean }
) {
    return isSprintEffectivelyLocked(sprint) || story.locked || subtask.locked;
}
