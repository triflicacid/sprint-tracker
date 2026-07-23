import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { DayActivityMap } from "@shared/types";
import { api } from "../../../api/client";
import { SprintActivityCalendar } from "../../calendar/SprintActivityCalendar";
import { ExportButton } from "../../ExportButton";
import { CollapsibleSection } from "../../CollapsibleSection";
import { formatDisplayDate } from "../../../utils/calendarGrid";
import type { PdfSection } from "../../../utils/pdfExport";

export interface CalendarSectionHandle {
    getReportSection(): PdfSection;
}

interface CalendarSectionProps {
    sprintId: number;
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    totalWeekdays: number;
    holidayWeekdays: number;
    onExport: () => Promise<void>;
}

// activity calendar for the sprint's date range. read-only - holiday editing
// lives on the sprint detail page.
export const CalendarSection = forwardRef<CalendarSectionHandle, CalendarSectionProps>(function CalendarSection(
    { sprintId, startDate, endDate, holidays, totalWeekdays, holidayWeekdays, onExport },
    ref
) {
    const [dayActivity, setDayActivity] = useState<DayActivityMap>({});
    const [loading, setLoading] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.getDayActivity(sprintId).then(setDayActivity);
    }, [sprintId]);

    async function handleExport() {
        setLoading(true);
        try {
            await onExport();
        } finally {
            setLoading(false);
        }
    }

    useImperativeHandle(ref, () => ({
        getReportSection() {
            const activeDayCount = Object.keys(dayActivity).length;
            return {
                title: "Calendar",
                element: chartRef.current ?? undefined,
                lines: [
                    `${totalWeekdays} working days between ${formatDisplayDate(startDate)} and ${formatDisplayDate(endDate)}`,
                    `${holidayWeekdays} of those were holidays`,
                    `${activeDayCount} day${activeDayCount === 1 ? "" : "s"} had subtask activity`,
                ],
            };
        },
    }));

    return (
        <CollapsibleSection title="Calendar" headerActions={<ExportButton onClick={handleExport} loading={loading} />}>
            <div ref={chartRef}>
                <SprintActivityCalendar
                    startDate={startDate}
                    endDate={endDate}
                    holidays={holidays}
                    dayActivity={dayActivity}
                />
            </div>
        </CollapsibleSection>
    );
});
