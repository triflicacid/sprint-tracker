import type { SubtaskStatus } from "./types.js";

export interface StatusHistoryLike {
    status: SubtaskStatus;
    changedAt: string;
}

/**
 * returns the status active at the end of the given day.
 *
 * @param sortedHistory - full status history sorted by `changedAt` ascending.
 * @param dateString - date in `yyyy-mm-dd` format.
 * @param fallbackStatus - status to use when there is no history.
 * @returns the last status reached on or before the given date.
 */
export function statusAsOf(
    sortedHistory: StatusHistoryLike[],
    dateString: string,
    fallbackStatus: SubtaskStatus = "NEW"
): SubtaskStatus {
    if (sortedHistory.length === 0) {
        return fallbackStatus;
    }
    let status: SubtaskStatus = "NEW";
    for (const entry of sortedHistory) {
        if (entry.changedAt.slice(0, 10) <= dateString) {
            status = entry.status;
        } else {
            break;
        }
    }
    return status;
}
