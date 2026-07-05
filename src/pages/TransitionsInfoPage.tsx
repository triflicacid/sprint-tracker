import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FlowState, StatusFlowConfig } from "@shared/types";
import { api } from "../api/client";
import { FlowDiagram, type FlowEdge } from "../components/flow/FlowDiagram";
import { STATUS_COLORS, STATUS_LABELS } from "../components/StatusBadge";

function allTransitionEdges(flow: StatusFlowConfig): FlowEdge[] {
    return flow.transitions.flatMap((transition) =>
        transition.to.map((to) => ({
            id: `${transition.from}-${to}`,
            from: transition.from,
            to,
            title: `${STATUS_LABELS[transition.from] ?? transition.from} → ${STATUS_LABELS[to] ?? to}`,
        }))
    );
}

// "/transitions": reference diagram of the whole status flow and status descriptions
export function TransitionsInfoPage(): React.ReactElement {
    const [flow, setFlow] = useState<StatusFlowConfig | null>(null);

    useEffect(() => {
        api.getStatusFlow().then(setFlow);
    }, []);

    if (!flow) {
        return <div className="page">loading...</div>;
    }

    const statesByRank = [...flow.states].sort((a, b) => a.rank - b.rank);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">
                        back to sprints
                    </Link>
                    <h1>Transitions</h1>
                </div>
            </div>

            <FlowDiagram flow={flow} edges={allTransitionEdges(flow)} />

            <h2>States</h2>
            <div className="flow-state-list">
                {statesByRank.map((state) => (
                    <div key={state.id} className="flow-state-entry">
                        <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[state.id] }}>
                            {state.label}
                        </span>
                        <p className="flow-state-description">{state.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
