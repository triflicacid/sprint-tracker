import React from "react";
import type { StatusHistoryEntry } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";
import { buildTransitionRows, formatDateTime } from "../../utils/subtaskTiming";

interface SubtaskFlowDiagramProps {
    history: StatusHistoryEntry[];
}

// a subtask's actual path through its statuses, drawn as a linear chain
export function SubtaskFlowDiagram({ history }: SubtaskFlowDiagramProps) {
    // filter out no-ops (transitions to same state)
    const rows = buildTransitionRows(history)
        .filter((row, i, all) => i === 0 || row.status !== all[i - 1].status);

    if (rows.length === 0) {
        return <p className="flow-chain-empty">not started yet.</p>;
    }

    return (
        <div className="flow-chain">
            {rows.map((row, i) => (
                <React.Fragment key={row.id}>
                    {i > 0 && <span className="flow-chain-arrow">&rarr;</span>}
                    <span
                        className="flow-node"
                        style={{ backgroundColor: STATUS_COLORS[row.status] }}
                        title={`${formatDateTime(row.changedAt)} — ${STATUS_LABELS[row.status]}`}
                    >
                        {STATUS_LABELS[row.status]}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
}
