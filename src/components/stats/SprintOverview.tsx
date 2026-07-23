import React, { useEffect, useRef, useState } from "react";
import type { SprintSummary, VelocityPoint, VelocitySelection } from "@shared/types";
import { api } from "../../api/client";
import { ExportButton } from "../ExportButton";
import { CollapsibleSection } from "../CollapsibleSection";
import { formatIsoDate } from "../../utils/calendarGrid";
import { exportSectionsAsPdf, type PdfSection } from "../../utils/pdfExport";
import { VelocityOverview, type VelocityOverviewHandle } from "./VelocityOverview";
import { ProjectOverview, type ProjectOverviewHandle } from "./ProjectOverview";
import "./statsShared.css";

// describes which sprints a velocity selection covers, for the pdf report.
function describeVelocitySelection(selection: VelocitySelection): string {
    if (selection.mode === "range") {
        return `${selection.from || "?"} to ${selection.to || "?"}`;
    }
    if (selection.mode === "lastN") {
        return `last ${selection.n} sprints`;
    }
    return "all sprints";
}

// calculate the average velocity of all given sprints
function averageVelocity(points: VelocityPoint[]) {
    return points.length === 0
        ? undefined
        : Math.round(points.map((point => point.completedPoints)).reduce((a, b) => a + b) / points.length * 10) / 10;
}

interface SprintOverviewProps {
    sprints: SprintSummary[];
    latestSprintId: number;
}

/**
 * multi-sprint overview showing velocity and project distribution across a selected date range
 *
 * displays when no specific sprint is selected on the stats page
 */
export function SprintOverview({ sprints, latestSprintId }: SprintOverviewProps) {
    const [velocityMode, setVelocityMode] = useState<VelocitySelection["mode"]>("lastN");
    const [velocityN, setVelocityN] = useState<number>(5);
    const [velocityRangeFrom, setVelocityRangeFrom] = useState<string>("");
    const [velocityRangeTo, setVelocityRangeTo] = useState<string>("");
    const [velocityPoints, setVelocityPoints] = useState<VelocityPoint[]>([]);
    const [exporting, setExporting] = useState(false);

    const velocityRef = useRef<VelocityOverviewHandle>(null);
    const projectRef = useRef<ProjectOverviewHandle>(null);

    // velocity range defaults
    useEffect(() => {
        if (sprints.length === 0 || velocityRangeFrom || velocityRangeTo) {
            return;
        }
        const sorted = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate));
        const lastFive = sorted.slice(-5);
        setVelocityRangeFrom(lastFive[0]?.startDate ?? "");
        setVelocityRangeTo(formatIsoDate(new Date()));
    }, [sprints]);

    const velocitySelection: VelocitySelection =
        velocityMode === "range"
            ? { mode: "range", from: velocityRangeFrom, to: velocityRangeTo }
            : velocityMode === "lastN"
              ? { mode: "lastN", n: velocityN }
              : { mode: "all" };

    useEffect(() => {
        api.getVelocityHistory(latestSprintId, velocitySelection).then(setVelocityPoints);
    }, [latestSprintId, velocityMode, velocityN, velocityRangeFrom, velocityRangeTo]);

    async function handleExportVelocity() {
        const chartElement = velocityRef.current?.getChartElement();
        if (!chartElement) return;

        const section: PdfSection = {
            title: "Velocity",
            element: chartElement,
            lines: [
                `Showing: ${describeVelocitySelection(velocitySelection)}`,
                ...(velocityPoints.length > 0
                    ? velocityPoints.map(
                          (point) =>
                              `${point.sprintName}: ${point.completedPoints} pts (${point.unpointedDoneStoryCount} stories unpointed)`
                      )
                    : ["No sprints in this selection."]),
                `Average velocity: ${averageVelocity(velocityPoints) ?? 'N/A'}`,
            ],
        };
        await exportSectionsAsPdf([section], `velocity-${formatIsoDate(new Date())}.pdf`);
    }

    async function handleExportProjects() {
        const chartElement = projectRef.current?.getChartElement();
        const projectData = projectRef.current?.getProjectData() ?? [];
        if (!chartElement || projectData.length === 0) return;

        const totalSprints = projectData.reduce((sum, p) => sum + p.value, 0);
        const section: PdfSection = {
            title: "Projects",
            element: chartElement,
            lines: [
                `Showing: ${describeVelocitySelection(velocitySelection)}`,
                ...projectData.map(
                    p => `${p.name}: ${p.value} sprint${p.value === 1 ? "" : "s"} (${Math.round((p.value / totalSprints) * 100)}%)`
                ),
            ],
        };
        await exportSectionsAsPdf([section], `projects-${formatIsoDate(new Date())}.pdf`);
    }

    async function handleExportAll() {
        setExporting(true);
        try {
            const velocityChartElement = velocityRef.current?.getChartElement();
            const projectChartElement = projectRef.current?.getChartElement();
            const projectData = projectRef.current?.getProjectData() ?? [];
            const totalSprints = projectData.reduce((sum, p) => sum + p.value, 0);

            const sections: PdfSection[] = [];

            if (velocityChartElement) {
                sections.push({
                    title: "Velocity",
                    element: velocityChartElement,
                    lines: [
                        `Showing: ${describeVelocitySelection(velocitySelection)}`,
                        ...(velocityPoints.length > 0
                            ? velocityPoints.map(
                                  (point) =>
                                      `${point.sprintName}: ${point.completedPoints} pts (${point.unpointedDoneStoryCount} stories unpointed)`
                              )
                            : ["No sprints in this selection."]),
                        `Average velocity: ${averageVelocity(velocityPoints) ?? 'N/A'}`,
                    ],
                });
            }

            if (projectChartElement && projectData.length > 0) {
                sections.push({
                    title: "Projects",
                    element: projectChartElement,
                    lines: [
                        `Showing: ${describeVelocitySelection(velocitySelection)}`,
                        ...projectData.map(
                            p => `${p.name}: ${p.value} sprint${p.value === 1 ? "" : "s"} (${Math.round((p.value / totalSprints) * 100)}%)`
                        ),
                    ],
                });
            }

            await exportSectionsAsPdf(sections, `sprint-overview-${formatIsoDate(new Date())}.pdf`);
        } finally {
            setExporting(false);
        }
    }

    return (
        <CollapsibleSection
            title="Sprint Overview"
            headerActions={
                <div className="page-header-actions">
                    <div className="granularity-toggle">
                        <button
                            className={velocityMode === "all" ? "active" : ""}
                            onClick={() => setVelocityMode("all")}
                        >
                            all sprints
                        </button>
                        <button
                            className={velocityMode === "range" ? "active" : ""}
                            onClick={() => setVelocityMode("range")}
                        >
                            date range
                        </button>
                        <button
                            className={velocityMode === "lastN" ? "active" : ""}
                            onClick={() => setVelocityMode("lastN")}
                        >
                            last N
                        </button>
                    </div>
                    {velocityMode === "range" && (
                        <>
                            <input
                                type="date"
                                value={velocityRangeFrom}
                                onChange={(event) => setVelocityRangeFrom(event.target.value)}
                            />
                            <input
                                type="date"
                                value={velocityRangeTo}
                                onChange={(event) => setVelocityRangeTo(event.target.value)}
                            />
                        </>
                    )}
                    {velocityMode === "lastN" && (
                        <input
                            type="number"
                            min={1}
                            value={velocityN}
                            style={{ width: 60 }}
                            onChange={(event) => setVelocityN(Math.max(1, Number(event.target.value) || 1))}
                        />
                    )}
                    <ExportButton onClick={handleExportAll} loading={exporting} label="export all as pdf" />
                </div>
            }
        >
            <VelocityOverview
                ref={velocityRef}
                velocityPoints={velocityPoints}
                latestSprintId={latestSprintId}
                onExport={handleExportVelocity}
            />

            <ProjectOverview
                ref={projectRef}
                sprints={sprints}
                velocityPoints={velocityPoints}
                onExport={handleExportProjects}
            />
        </CollapsibleSection>
    );
}


