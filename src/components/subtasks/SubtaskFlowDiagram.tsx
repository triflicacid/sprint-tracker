import React from "react";
import type { StatusFlowConfig, StatusHistoryEntry } from "@shared/types";
import { STATUS_LABELS } from "../StatusBadge";
import { FlowDiagram, type FlowEdge } from "../flow/FlowDiagram";

interface SubtaskFlowDiagramProps {
    flow: StatusFlowConfig;
    history: StatusHistoryEntry[];
}

// shows a subtask's path through its flow
// similar to the FlowDiagram, but only for a given task, not all statuses
export function SubtaskFlowDiagram({ flow, history }: SubtaskFlowDiagramProps): React.ReactElement {
    const reachedStatuses = new Set(history.map((entry) => entry.status));

    const sortedHistory = [...history].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );

    const edges: FlowEdge[] = [];
    for (let i = 1; i < sortedHistory.length; i++) {
        const from: string = sortedHistory[i - 1].status;
        const to: string = sortedHistory[i].status;
        if (from === to) {
            continue;
        }
        edges.push({
            id: `${from}-${to}-${i}`,
            from,
            to,
            title: `${STATUS_LABELS[from] ?? from} → ${STATUS_LABELS[to] ?? to} on ${sortedHistory[i].changedAt.slice(0, 10)}`,
        });
    }

    return <FlowDiagram flow={flow} edges={edges} reachedStatuses={reachedStatuses} />;
}
