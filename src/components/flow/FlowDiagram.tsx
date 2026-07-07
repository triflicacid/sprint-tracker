import React, { useLayoutEffect, useRef, useState } from "react";
import type { StatusFlowConfig, SubtaskStatus } from "@shared/types";
import { STATUS_COLORS } from "../StatusBadge";

// `id` must be unique per edge, even for a repeated from/to pair
export interface FlowEdge {
    id: string;
    from: SubtaskStatus;
    to: SubtaskStatus;
    title: string;
}

export interface FlowDiagramProps {
    flow: StatusFlowConfig;
    edges: FlowEdge[];
    reachedStatuses?: Set<string>;
}

interface NodePosition {
    x: number;
    bottom: number;
}

interface Arc {
    key: string;
    path: string;
    color: string;
    markerId: string;
    title: string;
}

// generic node+arrow flow diagram for statuses
export function FlowDiagram({ flow, edges, reachedStatuses }: FlowDiagramProps): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [positions, setPositions] = useState<Record<string, NodePosition>>({});

    const states = [...flow.states].sort((a, b) => a.rank - b.rank);

    useLayoutEffect(() => {
        function measure() {
            const container = containerRef.current;
            if (!container) {
                return;
            }
            const containerRect = container.getBoundingClientRect();
            const next: Record<string, NodePosition> = {};
            for (const state of states) {
                const node = nodeRefs.current.get(state.id);
                if (!node) {
                    continue;
                }
                const rect = node.getBoundingClientRect();
                next[state.id] = {
                    x: rect.left + rect.width / 2 - containerRect.left,
                    bottom: rect.bottom - containerRect.top,
                };
            }
            setPositions(next);
        }
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flow, edges]);

    const pairCounts: Record<string, number> = {};
    const arcs: Arc[] = [];
    for (const edge of edges) {
        const fromPos = positions[edge.from];
        const toPos = positions[edge.to];
        if (!fromPos || !toPos) {
            continue;
        }

        const pairKey = `${edge.from}|${edge.to}`;
        const repeatIndex = pairCounts[pairKey] ?? 0;
        pairCounts[pairKey] = repeatIndex + 1;

        const fromRank = states.find((state) => state.id === edge.from)?.rank ?? 0;
        const toRank = states.find((state) => state.id === edge.to)?.rank ?? 0;
        const isBackward = toRank < fromRank;
        const dx = Math.abs(toPos.x - fromPos.x);
        const bow = 20 + dx * 0.12 + (isBackward ? 36 : 0) + repeatIndex * 16;
        const midX = (fromPos.x + toPos.x) / 2;
        const controlY = Math.max(fromPos.bottom, toPos.bottom) + bow;
        const color = STATUS_COLORS[edge.to];

        arcs.push({
            key: edge.id,
            path: `M ${fromPos.x} ${fromPos.bottom} Q ${midX} ${controlY} ${toPos.x} ${toPos.bottom}`,
            color,
            markerId: `flow-arrow-${edge.to}`,
            title: edge.title,
        });
    }

    const markerColors: Map<string, string> = new Map();
    for (const arc of arcs) {
        markerColors.set(arc.markerId, arc.color);
    }

    return (
        <div className="flow-diagram" ref={containerRef}>
            <div className="flow-nodes">
                {states.map((state) => (
                    <div
                        key={state.id}
                        ref={(el) => {
                            if (el) {
                                nodeRefs.current.set(state.id, el);
                            } else {
                                nodeRefs.current.delete(state.id);
                            }
                        }}
                        className="flow-node"
                        style={{
                            backgroundColor: STATUS_COLORS[state.id],
                            opacity: reachedStatuses && !reachedStatuses.has(state.id) ? 0.35 : 1,
                        }}
                        title={state.description}
                    >
                        {state.label}
                    </div>
                ))}
            </div>
            <svg className="flow-arcs">
                <defs>
                    {Array.from(markerColors.entries()).map(([id, color]) => (
                        <marker
                            key={id}
                            id={id}
                            markerWidth="8"
                            markerHeight="8"
                            refX="7"
                            refY="4"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                        </marker>
                    ))}
                </defs>
                {arcs.map((arc) => (
                    <path
                        key={arc.key}
                        d={arc.path}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={2}
                        markerEnd={`url(#${arc.markerId})`}
                    >
                        <title>{arc.title}</title>
                    </path>
                ))}
            </svg>
        </div>
    );
}
