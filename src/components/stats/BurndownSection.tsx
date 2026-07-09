import React, { forwardRef, useState } from "react";
import type { StatusBreakdownGranularity } from "@shared/types";
import type { BurndownPoint, AdvancedBurndownPoint } from "../../utils/burndown";
import { BurndownChart } from "./BurndownChart";
import { AdvancedBurndownChart } from "./AdvancedBurndownChart";
import { ExportButton } from "../ExportButton";
import { BURNDOWN_MILESTONES } from "../StatusBadge";

interface BurndownSectionProps {
    granularity: StatusBreakdownGranularity;
    setGranularity: (granularity: StatusBreakdownGranularity) => void;
    burndownPoints: BurndownPoint[];
    advancedBurndownPoints: AdvancedBurndownPoint[];
    onExport: () => Promise<void>;
}

// basic/advanced burndown
export const BurndownSection = forwardRef<HTMLDivElement, BurndownSectionProps>(function BurndownSection(
    { granularity, setGranularity, burndownPoints, advancedBurndownPoints, onExport },
    ref
) {
    const [burndownMode, setBurndownMode] = useState<"basic" | "advanced">("basic");
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        setLoading(true);
        try {
            await onExport();
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <h2>Burndown</h2>
                <div className="page-header-actions">
                    <div className="granularity-toggle">
                        <button
                            className={burndownMode === "basic" ? "active" : ""}
                            onClick={() => setBurndownMode("basic")}
                        >
                            basic
                        </button>
                        <button
                            className={burndownMode === "advanced" ? "active" : ""}
                            onClick={() => setBurndownMode("advanced")}
                        >
                            advanced
                        </button>
                    </div>
                    <div className="granularity-toggle">
                        <button
                            className={granularity === "subtask" ? "active" : ""}
                            onClick={() => setGranularity("subtask")}
                        >
                            subtasks
                        </button>
                        <button
                            className={granularity === "story" ? "active" : ""}
                            onClick={() => setGranularity("story")}
                        >
                            stories
                        </button>
                    </div>
                    <ExportButton onClick={handleExport} loading={loading} />
                </div>
            </div>
            <div data-testid="burndown-chart-visible">
                {burndownMode === "basic" ? (
                    <BurndownChart points={burndownPoints} />
                ) : (
                    <AdvancedBurndownChart points={advancedBurndownPoints} milestones={BURNDOWN_MILESTONES} />
                )}
            </div>
            {/* always-mounted off-screen: the pdf export shows both charts side by side,
                independent of which one the basic/advanced toggle currently shows on screen */}
            <div
                data-testid="burndown-chart-export"
                style={{ position: "fixed", top: 0, left: -10000, width: 1000, pointerEvents: "none" }}
            >
                <div ref={ref} style={{ display: "flex", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>Basic</div>
                        <BurndownChart points={burndownPoints} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>Advanced</div>
                        <AdvancedBurndownChart points={advancedBurndownPoints} milestones={BURNDOWN_MILESTONES} />
                    </div>
                </div>
            </div>
        </>
    );
});
