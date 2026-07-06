import type { StatusHistoryEntry } from "@shared/types";
import { STATUS_LABELS, SUBTASK_STATUSES } from "../components/StatusBadge";

export interface SubtaskTiming {
    // total days from the first history entry to the last
    totalDays: number;
    // written report lines: a dated list of transitions, then a "total time
    // in each phase" summary
    lines: string[];
}

function daysBetween(fromIso: string, toIso: string) {
    const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function formatDays(days: number) {
    return `${days} day${days === 1 ? "" : "s"}`;
}

// builds the "transitions + total time per phase" report for one subtask's
// status history
export function computeSubtaskTiming(history: StatusHistoryEntry[], now: Date = new Date()) {
    if (history.length === 0) {
        return { totalDays: 0, lines: ["No status history recorded yet."] } as SubtaskTiming;
    }

    const sorted = [...history].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
    const totalsByStatus: Record<string, number> = {};
    const transitionLines: string[] = [];

    for (let i = 0; i < sorted.length; i += 1) {
        const entry = sorted[i];
        const date = entry.changedAt.slice(0, 10);
        const label = STATUS_LABELS[entry.status] ?? entry.status.toLowerCase();
        if (i === 0) {
            transitionLines.push(`${date}: ${label}`);
            continue;
        }
        const previous = sorted[i - 1];
        const days = daysBetween(previous.changedAt, entry.changedAt);
        const previousLabel = STATUS_LABELS[previous.status] ?? previous.status.toLowerCase();
        transitionLines.push(`${date}: ${label} (${formatDays(days)} in ${previousLabel})`);
        totalsByStatus[previous.status] = (totalsByStatus[previous.status] ?? 0) + days;
    }

    const last = sorted[sorted.length - 1];
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
        totalDays: daysBetween(sorted[0].changedAt, isTerminal ? last.changedAt : now.toISOString()),
        lines: ["Transitions:", ...transitionLines, "", "Total time in each phase:", totalParts.join(", ")],
    } as SubtaskTiming;
}
