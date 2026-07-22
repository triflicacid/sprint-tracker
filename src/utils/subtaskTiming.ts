import type { StatusHistoryEntry, Subtask, SubtaskStatus } from "@shared/types";
import { STATUS_LABELS, STATUS_COLORS, SUBTASK_STATUSES } from "../components/StatusBadge";
import type { PdfSection, PdfTable } from "./pdfExport";
import { hexToRgb } from "./colourUtils";

/**
 * timing breakdown for a subtask
 */
export interface SubtaskTiming {
    /** total days from the first history entry to the last */
    totalDays: number;
    /** written report lines: a dated list of transitions, then a summary */
    lines: string[];
}

/**
 * one row of a subtask's transition history, sorted ascending
 *
 * keeps full timestamp (not truncated to date) for precise duration math
 */
export interface TransitionRow {
    id: number;
    changedAt: string;
    status: SubtaskStatus;
    // days spent in the previous status before this transition
    daysInPrevious: number | null;
    // same duration as daysInPrevious, but exact milliseconds
    msInPrevious: number | null;
}

function daysBetween(fromIso: string, toIso: string) {
    const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function formatDays(days: number) {
    return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * formats a timestamp as "YYYY-MM-DD HH:MM"
 *
 * reads directly from the string to avoid timezone shifts - sqlite stores
 * naive wall-clock timestamps that would be silently offset if parsed via Date
 *
 * @param changedAt ISO-like timestamp string
 * @returns formatted string in "YYYY-MM-DD HH:MM" format
 */
export function formatDateTime(changedAt: string) {
    const match = changedAt.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    if (match) {
        return `${match[1]} ${match[2]}:${match[3]}`;
    }
    return `${changedAt.slice(0, 10)} 00:00`;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * formats a duration as "Xd Yh Zm"
 *
 * always includes all three units (even when zero) for consistent table alignment
 *
 * @param ms duration in milliseconds
 * @returns formatted string like "2d 3h 15m"
 */
export function formatDurationDHM(ms: number): string {
    const total = Math.max(0, Math.round(ms / MINUTE_MS)) * MINUTE_MS;
    const days = Math.floor(total / DAY_MS);
    const hours = Math.floor((total % DAY_MS) / HOUR_MS);
    const minutes = Math.floor((total % HOUR_MS) / MINUTE_MS);
    return `${days}d ${hours}h ${minutes}m`;
}

/**
 * sorts a subtask's raw history and pairs each entry with how long the previous status lasted
 *
 * @param history unsorted status history entries
 * @returns sorted rows with duration calculations
 */
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
    // summary lines, or empty array when there's no history
    lines: string[];
}

/**
 * computes total time spent in each phase
 *
 * @param rows sorted transition rows
 * @param now current time for ongoing status calculation
 * @returns total days and summary lines
 */
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
        const label = STATUS_LABELS[status as SubtaskStatus];
        const ongoingSuffix = !isTerminal && status === last.status ? " (ongoing)" : "";
        return `${label}: ${formatDays(days)}${ongoingSuffix}`;
    });

    return {
        totalDays: daysBetween(rows[0].changedAt, isTerminal ? last.changedAt : now.toISOString()),
        lines: ["Total time in each phase:", totalParts.join(", ")],
    };
}

/**
 * builds transitions and phase totals report for one subtask's status history
 *
 * @param history status history entries
 * @param now current time (defaults to now)
 * @returns timing breakdown with flat text lines
 */
export function computeSubtaskTiming(history: StatusHistoryEntry[], now: Date = new Date()) {
    const rows = buildTransitionRows(history);
    if (rows.length === 0) {
        return { totalDays: 0, lines: ["No status history recorded yet."] } as SubtaskTiming;
    }

    const transitionLines = rows.map((row, i) => {
        const date = row.changedAt.slice(0, 10);
        const label = STATUS_LABELS[row.status];
        if (i === 0) {
            return `${date}: ${label}`;
        }
        const previousLabel = STATUS_LABELS[rows[i - 1].status];
        return `${date}: ${label} (${formatDays(row.daysInPrevious ?? 0)} in ${previousLabel})`;
    });

    const totals = computePhaseTotals(rows, now);

    return {
        totalDays: totals.totalDays,
        lines: ["Transitions:", ...transitionLines, "", ...totals.lines],
    } as SubtaskTiming;
}


/**
 * builds the transitions table for PDF export
 * 
 * mirrors SubtaskTransitionsTable.tsx with colored state column
 * 
 * @param history status history entries
 * @returns PDF table structure with one row per transition
 */
export function buildTransitionsPdfTable(history: StatusHistoryEntry[]): PdfTable {
    const rows = buildTransitionRows(history);
    return {
        headers: ["date/time", "state", "time in previous"],
        columnWidths: [55, 45, 55],
        rows: rows.map((row) => [
            { text: formatDateTime(row.changedAt) },
            {
                text: STATUS_LABELS[row.status],
                color: hexToRgb(STATUS_COLORS[row.status]),
            },
            { text: row.msInPrevious === null ? "-" : formatDurationDHM(row.msInPrevious) },
        ]),
    };
}

/**
 * builds phase totals summary lines
 * 
 * @param history status history entries
 * @param now current time (defaults to now)
 * @returns summary lines
 */
export function buildPhaseTotalsLines(history: StatusHistoryEntry[], now: Date = new Date()): string[] {
    return computePhaseTotals(buildTransitionRows(history), now).lines;
}

/**
 * builds one subtask's PDF export section
 * 
 * @param subtask the subtask to export
 * @param history status history entries
 * @returns PDF section with transitions table and summary
 */
export function buildSubtaskPdfSection(subtask: Subtask, history: StatusHistoryEntry[]): PdfSection {
    return {
        title: subtask.branchName === "(unknown)" ? subtask.title : `${subtask.title} (${subtask.branchName})`,
        table: history.length > 0 ? buildTransitionsPdfTable(history) : undefined,
        lines: [
            ...(subtask.url ? [{ text: `Pull request: ${subtask.url}`, url: subtask.url }] : []),
            ...(history.length > 0 ? buildPhaseTotalsLines(history) : ["No status history recorded yet."]),
        ],
    };
}
