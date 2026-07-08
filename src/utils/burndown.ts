import type { StatusBreakdownPoint } from "@shared/types";

export interface BurndownPoint {
    date: string;
    actual: number;
    ideal: number;
}

export function computeBurndownPoints(points: StatusBreakdownPoint[], isWorkingDay: (date: string) => boolean) {
    if (points.length === 0) {
        return [];
    }

    const total = Object.values(points[0].counts).reduce((sum, count) => sum + count, 0);
    const workingDayCount = points.filter((point) => isWorkingDay(point.date)).length;
    const step = workingDayCount > 0 ? total / workingDayCount : 0;

    let cumulativeWorkingDays = 0;
    return points.map((point) => {
        if (isWorkingDay(point.date)) {
            cumulativeWorkingDays += 1;
        }
        const actual = total - (point.counts["DONE"] ?? 0);
        const ideal = workingDayCount > 0 ? Math.max(0, total - step * cumulativeWorkingDays) : total;
        return { date: point.date, actual, ideal: Math.round(ideal * 10) / 10 } as BurndownPoint;
    });
}
