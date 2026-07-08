import React, { forwardRef } from "react";
import type { DayActivityMap } from "@shared/types";
import { SprintActivityCalendar } from "../calendar/SprintActivityCalendar";
import { ExportButton } from "../ExportButton";

interface CalendarSectionProps {
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    dayActivity: DayActivityMap;
    onToggleHoliday: (date: string) => void;
    onExport: () => void;
    loading: boolean;
}

// activity calendar for the sprint's date range
export const CalendarSection = forwardRef<HTMLDivElement, CalendarSectionProps>(function CalendarSection(
    { startDate, endDate, holidays, dayActivity, onToggleHoliday, onExport, loading },
    ref
) {
    return (
        <>
            <div className="page-header">
                <h2>Calendar</h2>
                <ExportButton onClick={onExport} loading={loading} />
            </div>
            <div ref={ref}>
                <SprintActivityCalendar
                    startDate={startDate}
                    endDate={endDate}
                    holidays={holidays}
                    dayActivity={dayActivity}
                    onToggleHoliday={onToggleHoliday}
                />
            </div>
        </>
    );
});
