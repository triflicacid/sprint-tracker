import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { DayActivityMap } from "@shared/types";
import { api } from "../../api/client";
import { SprintActivityCalendar } from "../calendar/SprintActivityCalendar";
import { ExportButton } from "../ExportButton";
import type { PdfSection } from "../../utils/pdfExport";

export interface CalendarSectionHandle {
    getReportSection(): PdfSection;
}

interface CalendarSectionProps {
    sprintId: number;
    startDate: string;
    endDate: string;
    holidays: Set<string>;
    onHolidaysChange: (holidays: Set<string>) => void;
    totalWeekdays: number;
    holidayWeekdays: number;
    onExport: () => Promise<void>;
}

// activity calendar for the sprint's date range
// toggle holidays by clicking on a day
export const CalendarSection = forwardRef<CalendarSectionHandle, CalendarSectionProps>(function CalendarSection(
    { sprintId, startDate, endDate, holidays, onHolidaysChange, totalWeekdays, holidayWeekdays, onExport },
    ref
) {
    const [dayActivity, setDayActivity] = useState<DayActivityMap>({});
    const [loading, setLoading] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.getDayActivity(sprintId).then(setDayActivity);
    }, [sprintId]);

    async function handleToggleHoliday(date: string) {
        if (holidays.has(date)) {
            await api.removeHoliday(date);
        } else {
            await api.addHoliday(date);
        }
        const dates = await api.listHolidays(startDate, endDate);
        onHolidaysChange(new Set(dates));
    }

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
                    `${totalWeekdays} working days between ${startDate} and ${endDate}`,
                    `${holidayWeekdays} of those were holidays`,
                    `${activeDayCount} day${activeDayCount === 1 ? "" : "s"} had subtask activity`,
                ],
            };
        },
    }));

    return (
        <>
            <div className="page-header">
                <h2>Calendar</h2>
                <ExportButton onClick={handleExport} loading={loading} />
            </div>
            <div ref={chartRef}>
                <SprintActivityCalendar
                    startDate={startDate}
                    endDate={endDate}
                    holidays={holidays}
                    dayActivity={dayActivity}
                    onToggleHoliday={handleToggleHoliday}
                />
            </div>
        </>
    );
});
