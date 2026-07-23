import React, { forwardRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SprintStats } from "@shared/types";
import { ExportButton } from "../../ExportButton";
import { CollapsibleSection } from "../../CollapsibleSection";

interface RepoDistributionSectionProps {
    repoCounts: SprintStats["repoCounts"];
    onExport: () => Promise<void>;
}

// bar chart of pull requests per repo for the selected sprint.
export const RepoDistributionSection = forwardRef<HTMLDivElement, RepoDistributionSectionProps>(
    function RepoDistributionSection({ repoCounts, onExport }, ref) {
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
            <CollapsibleSection title="Repo distribution" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
                <div ref={ref}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={repoCounts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                            <YAxis type="category" dataKey="repoName" stroke="#9ca3af" width={180} />
                            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                            <Bar dataKey="count" fill="#d97706" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CollapsibleSection>
        );
    }
);
