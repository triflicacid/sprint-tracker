import type { StatusHistoryEntry } from "@shared/types";
import { STATUS_LABELS, SUBTASK_STATUSES } from "../components/StatusBadge";

export interface SubtaskTiming {
    // total days from the first history entry to the last
    totalDays: number;
    // written report lines: a dated list of transitions, then a "total time
    // in each phase" summary
    lines: string[];
}

// one row of a subtask's transition history, sorted ascending. `changedAt` is
// kept as the full timestamp (not truncated to a date) so duration math
// stays precise even when several rows land on the same calendar day.
export interface TransitionRow {
    id: number;
    changedAt: string;
    status: string;
    // days spent in the PREVIOUS row's status before this transition -
    // null for the first row, since there's no previous status. Whole days,
    // rounded - used by the pdf export's "total time per phase" summary.
    daysInPrevious: number | null;
    // same duration as daysInPrevious, but exact milliseconds - used by the
    // on-page transitions table's days/hours/minutes breakdown, where
    // rounding to whole days would hide same-day transitions entirely.
    msInPrevious: number | null;
}

function daysBetween(fromIso: string, toIso: string) {
    const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function formatDays(days: number) {
    return `${days} day${days === 1 ? "" : "s"}`;
}

// "YYYY-MM-DD HH:MM", read directly off the stored string rather than via
// `new Date(...).getHours()` - changedAt has no timezone component (sqlite
// stores it as a naive "YYYY-MM-DD HH:MM:SS" wall-clock string), and a
// same-format/no-offset string is parsed as LOCAL time by `Date`, which would
// silently shift the displayed hour depending on the runtime's timezone.
// Reading the digits straight out of the string sidesteps that entirely.
export function formatDateTime(changedAt: string): string {
    const match = changedAt.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    if (match) {
        return `${match[1]} ${match[2]}:${match[3]}`;
    }
    return `${changedAt.slice(0, 10)} 00:00`;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// formats a duration as "Xd Yh Zm" - always all three units, even when zero,
// so every row in the transitions table lines up in the same shape.
export function formatDurationDHM(ms: number): string {
    const total = Math.max(0, Math.round(ms / MINUTE_MS)) * MINUTE_MS;
    const days = Math.floor(total / DAY_MS);
    const hours = Math.floor((total % DAY_MS) / HOUR_MS);
    const minutes = Math.floor((total % HOUR_MS) / MINUTE_MS);
    return `${days}d ${hours}h ${minutes}m`;
}

// sorts a subtask's raw history and pairs each entry with how long the
// previous status lasted - the one piece of date math the pdf export and the
// on-page transitions table both build on top of.
export function buildTransitionRows(history: StatusHistoryEntry[]): TransitionRow[] {
    const sorted = [...history].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
    return sorted.map((entry, i) => {
        if (i === 0) {
            return { id: entry.id, changedAt: entry.changedAt, status: entry.status, daysInPrevious: null, msInPrevious: null };
        }
        const ms = Math.max(0, new Date(entry.changedAt).getTime() - new Date(sorted[i - 1].changedAt).getTime());
        return {
            id: entry.id,
            changedAt: entry.changedAt,
            status: entry.status,
            daysInPrevious: daysBetween(sorted[i - 1].changedAt, entry.changedAt),
            msInPrevious: ms,
        };
    });
}

// builds the "transitions + total time per phase" report for one subtask's
// status history
export function computeSubtaskTiming(history: StatusHistoryEntry[], now: Date = new Date()) {
    const rows = buildTransitionRows(history);
    if (rows.length === 0) {
        return { totalDays: 0, lines: ["No status history recorded yet."] } as SubtaskTiming;
    }

    const totalsByStatus: Record<string, number> = {};
    const transitionLines: string[] = [];

    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const date = row.changedAt.slice(0, 10);
        const label = STATUS_LABELS[row.status] ?? row.status.toLowerCase();
        if (i === 0) {
            transitionLines.push(`${date}: ${label}`);
            continue;
        }
        const previousStatus = rows[i - 1].status;
        const previousLabel = STATUS_LABELS[previousStatus] ?? previousStatus.toLowerCase();
        const days = row.daysInPrevious ?? 0;
        transitionLines.push(`${date}: ${label} (${formatDays(days)} in ${previousLabel})`);
        totalsByStatus[previousStatus] = (totalsByStatus[previousStatus] ?? 0) + days;
    }

    const last = rows[rows.length - 1];
    const isTerminal = last.status === SUBTASK_STATUSES[SUBTASK_STATUSES.length - 1];
    if (!isTerminal) {
        totalsByStatus[last.status] = (totalsByStatus[last.status] ?? 0) + daysBetween(last.changedAt, now.toISOString());
    }

    const totalParts = Object.entries(totalsByStatus).map(([status, days]) => {
        const label = STATUS_LABELS[status] ?? status.toLowerCase();
        const ongoingSuffix = !isTerminal && status === last.status ? " (ongoing)" : "";
        return `${label}: ${formatDays(days)}${ongoingSuffix}`;
    });

    return {
        totalDays: daysBetween(rows[0].changedAt, isTerminal ? last.changedAt : now.toISOString()),
        lines: ["Transitions:", ...transitionLines, "", "Total time in each phase:", totalParts.join(", ")],
    } as SubtaskTiming;
}
