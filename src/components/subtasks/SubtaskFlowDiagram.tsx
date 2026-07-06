import React from "react";
import type { StatusHistoryEntry } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";
import { buildTransitionRows, formatDateTime } from "../../utils/subtaskTiming";

interface SubtaskFlowDiagramProps {
    history: StatusHistoryEntry[];
}

// a subtask's actual path through its statuses, drawn as a strictly linear
// chain - one lozenge per real transition, in chronological order. Unlike
// the general FlowDiagram (a fixed graph of every possible transition, used
// by TransitionsInfoPage as a reference), going BACK to an earlier status
// (e.g. IN_REVIEW -> PR_COMMENTS -> IN_REVIEW) draws a brand new lozenge each
// time rather than looping an arc back to one shared node - the point is to
// show what actually happened, in order, not the graph of what's possible.
export function SubtaskFlowDiagram({ history }: SubtaskFlowDiagramProps): React.ReactElement {
    // a genuine no-op (two consecutive rows with the identical status, which
    // the app itself never writes - subtaskService only records history when
    // status actually changes) is collapsed away rather than drawn as a
    // redundant repeated lozenge.
    const rows = buildTransitionRows(history).filter((row, i, all) => i === 0 || row.status !== all[i - 1].status);

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
                        style={{ backgroundColor: STATUS_COLORS[row.status] ?? "#6b7280" }}
                        title={`${formatDateTime(row.changedAt)} — ${STATUS_LABELS[row.status] ?? row.status.toLowerCase()}`}
                    >
                        {STATUS_LABELS[row.status] ?? row.status.toLowerCase()}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
}
