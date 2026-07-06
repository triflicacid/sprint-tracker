import type { StatusHistoryEntry } from "@shared/types";
import { STATUS_LABELS, STATUS_COLORS, SUBTASK_STATUSES } from "../components/StatusBadge";
import type { PdfTable } from "./pdfExport";

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

interface PhaseTotals {
    totalDays: number;
    // ["Total time in each phase:", "<comma-joined per-status totals>"] - or
    // [] when there's no history at all to summarize.
    lines: string[];
}

// the "total time per phase" summary shared by computeSubtaskTiming's
// flat-text report and the pdf table's post-table summary line.
function computePhaseTotals(rows: TransitionRow[], now: Date): PhaseTotals {
    if (rows.length === 0) {
        return { totalDays: 0, lines: [] };
    }

    const totalsByStatus: Record<string, number> = {};
    for (let i = 1; i < rows.length; i += 1) {
        const previousStatus = rows[i - 1].status;
        totalsByStatus[previousStatus] = (totalsByStatus[previousStatus] ?? 0) + (rows[i].daysInPrevious ?? 0);
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
        lines: ["Total time in each phase:", totalParts.join(", ")],
    };
}

// builds the "transitions + total time per phase" report for one subtask's
// status history, as flat text lines.
export function computeSubtaskTiming(history: StatusHistoryEntry[], now: Date = new Date()) {
    const rows = buildTransitionRows(history);
    if (rows.length === 0) {
        return { totalDays: 0, lines: ["No status history recorded yet."] } as SubtaskTiming;
    }

    const transitionLines = rows.map((row, i) => {
        const date = row.changedAt.slice(0, 10);
        const label = STATUS_LABELS[row.status] ?? row.status.toLowerCase();
        if (i === 0) {
            return `${date}: ${label}`;
        }
        const previousLabel = STATUS_LABELS[rows[i - 1].status] ?? rows[i - 1].status.toLowerCase();
        return `${date}: ${label} (${formatDays(row.daysInPrevious ?? 0)} in ${previousLabel})`;
    });

    const totals = computePhaseTotals(rows, now);

    return {
        totalDays: totals.totalDays,
        lines: ["Transitions:", ...transitionLines, "", ...totals.lines],
    } as SubtaskTiming;
}

function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace("#", "");
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

// the transitions table, drawn as real pdf text (not a screenshot) with the
// state column colored to match the on-screen status badge - mirrors
// SubtaskTransitionsTable.tsx exactly, one row per real transition.
export function buildTransitionsPdfTable(history: StatusHistoryEntry[]): PdfTable {
    const rows = buildTransitionRows(history);
    return {
        headers: ["date/time", "state", "time in previous"],
        columnWidths: [55, 45, 55],
        rows: rows.map((row) => [
            { text: formatDateTime(row.changedAt) },
            {
                text: STATUS_LABELS[row.status] ?? row.status.toLowerCase(),
                color: hexToRgb(STATUS_COLORS[row.status] ?? "#6b7280"),
            },
            { text: row.msInPrevious === null ? "-" : formatDurationDHM(row.msInPrevious) },
        ]),
    };
}

// the "total time per phase" summary alone, as flat text lines - used
// alongside buildTransitionsPdfTable so the pdf still gets that summary
// without repeating the full "Transitions:" text list the table replaces.
export function buildPhaseTotalsLines(history: StatusHistoryEntry[], now: Date = new Date()): string[] {
    return computePhaseTotals(buildTransitionRows(history), now).lines;
}
