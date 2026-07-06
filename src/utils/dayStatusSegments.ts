import type { StatusHistoryLike } from "@shared/statusHistory";

export interface DaySegment {
    status: string;
    durationMs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// parses changedAt as UTC, which is a "YYYY-MM-DD HH:MM:SS" string
// use instead of date to avoid timezone mis-alignment stuffs
function parseAsUtcMs(value: string) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):?(\d{2})?)?/);
    if (!match) {
        return new Date(value).getTime();
    }
    const [, y, mo, d, h = "0", mi = "0", s = "0"] = match;
    return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

// splits one calendar day into the status segments that made it up,
// in chronological order, given a subtask's full sorted history
export function computeDaySegments(sortedHistory: StatusHistoryLike[], dateString: string) {
    if (sortedHistory.length === 0) {
        return [];
    }

    const dayStart = parseAsUtcMs(dateString);
    const dayEnd = dayStart + DAY_MS;
    const segments: DaySegment[] = [];

    for (let i = 0; i < sortedHistory.length; i += 1) {
        const intervalStart = Math.max(parseAsUtcMs(sortedHistory[i].changedAt), dayStart);
        const intervalEnd = Math.min(
            i + 1 < sortedHistory.length ? parseAsUtcMs(sortedHistory[i + 1].changedAt) : dayEnd,
            dayEnd
        );
        if (intervalStart < intervalEnd) {
            segments.push({ status: sortedHistory[i].status, durationMs: intervalEnd - intervalStart });
        }
    }

    return segments;
}
