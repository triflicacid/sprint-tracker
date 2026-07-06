import type { SubtaskStatus } from "./types.js";

export interface StatusHistoryLike {
    status: SubtaskStatus;
    changedAt: string;
}

// the status a subtask was in as of the end of the given date (YYYY-MM-DD),
// given its full history sorted ascending by changedAt.
// If multiple transitions happened on the same day, return the LAST one
// that day.
export function statusAsOf(sortedHistory: StatusHistoryLike[], dateString: string) {
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
