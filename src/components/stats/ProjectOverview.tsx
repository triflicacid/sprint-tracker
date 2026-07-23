import React, { forwardRef, useState, useImperativeHandle } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SprintSummary, VelocityPoint } from "@shared/types";
import { ExportButton } from "../ExportButton";
import { CollapsibleSection } from "../CollapsibleSection";
import "./statsShared.css";

// color palette for project pie chart
const PROJECT_COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
    "#06b6d4", // cyan
    "#a855f7", // purple
];

// count sprints by project from the velocity points
function countSprintsByProject(sprints: SprintSummary[], velocityPoints: VelocityPoint[]): Array<{ name: string; value: number; color: string }> {
    const sprintIds = new Set(velocityPoints.map(p => p.sprintId));
    const sprintsInRange = sprints.filter(s => sprintIds.has(s.id));

    const projectCounts = new Map<string, number>();
    sprintsInRange.forEach(sprint => {
        const project = sprint.project || "(no project)";
        projectCounts.set(project, (projectCounts.get(project) || 0) + 1);
    });

    return Array.from(projectCounts.entries())
        .map(([name, value], index) => ({
            name,
            value,
            color: PROJECT_COLORS[index % PROJECT_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);
}

export interface ProjectOverviewHandle {
    getChartElement(): HTMLDivElement | null;
    getProjectData(): Array<{ name: string; value: number; color: string }>;
}

interface ProjectOverviewProps {
    sprints: SprintSummary[];
    velocityPoints: VelocityPoint[];
    onExport: () => Promise<void>;
}

/**
 * project distribution pie chart
 *
 * shows how many sprints are allocated to each project within the selected range
 */
export const ProjectOverview = forwardRef<ProjectOverviewHandle, ProjectOverviewProps>(
    function ProjectOverview({ sprints, velocityPoints, onExport }, ref) {
        const [loading, setLoading] = useState(false);
        const chartRef = React.useRef<HTMLDivElement>(null);

        const projectData = countSprintsByProject(sprints, velocityPoints);
        const totalSprints = projectData.reduce((sum, p) => sum + p.value, 0);

        useImperativeHandle(ref, () => ({
            getChartElement() {
                return chartRef.current;
            },
            getProjectData() {
                return projectData;
            },
        }));

        async function handleExport() {
            setLoading(true);
            try {
                await onExport();
            } finally {
                setLoading(false);
            }
        }

        if (projectData.length === 0) {
            return null;
        }

        return (
            <CollapsibleSection
                title="Projects"
                headerActions={<ExportButton onClick={handleExport} loading={loading} />}
            >
                <div ref={chartRef}>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart margin={{ top: 30, right: 30, bottom: 10, left: 30 }}>
                            <Pie
                                data={projectData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={100}
                                label
                            >
                                {projectData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CollapsibleSection>
        );
    }
);

