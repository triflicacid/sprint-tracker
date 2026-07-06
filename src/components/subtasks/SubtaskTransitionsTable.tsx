import React from "react";
import type { StatusHistoryEntry } from "@shared/types";
import { StatusBadge } from "../StatusBadge";
import { buildTransitionRows, formatDateTime, formatDurationDHM } from "../../utils/subtaskTiming";

interface SubtaskTransitionsTableProps {
    history: StatusHistoryEntry[];
}

function formatTimeInPrevious(ms: number | null): string {
    if (ms === null) {
        return "-";
    }
    return formatDurationDHM(ms);
}

// a dated list of every transition a subtask has been through, one row per
// transition even when several land on the same calendar day - the activity
// calendar collapses same-day transitions down to just the last one, this
// table is where every individual change is visible.
export function SubtaskTransitionsTable({ history }: SubtaskTransitionsTableProps): React.ReactElement | null {
    const rows = buildTransitionRows(history);
    if (rows.length === 0) {
        return null;
    }

    return (
        <table className="transitions-table">
            <thead>
                <tr>
                    <th>date/time</th>
                    <th>state</th>
                    <th>time in previous</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id}>
                        <td>{formatDateTime(row.changedAt)}</td>
                        <td>
                            <StatusBadge status={row.status} />
                        </td>
                        <td>{formatTimeInPrevious(row.msInPrevious)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
