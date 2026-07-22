import type { StatusBreakdownPoint, SubtaskStatus } from "@shared/types";

/**
 * one point on the basic burndown chart
 */
export interface BurndownPoint {
    date: string;
    actual: number;
    ideal: number;
}

/**
 * one point on the advanced burndown chart with milestone breakdown
 */
export interface AdvancedBurndownPoint {
    date: string;
    ideal: number;
    counts: Record<string, number>;
}

function computeTotal(points: StatusBreakdownPoint[]): number {
    if (points.length === 0) {
        return 0;
    }
    return Object.values(points[0].counts).reduce((sum, count) => sum + count, 0);
}

/**
 * computes ideal remaining series, shared by basic and advanced charts
 *
 * @param points status breakdown points
 * @param isWorkingDay predicate to check if a date is a working day
 * @returns array of ideal remaining values
 */
function computeIdealSeries(points: StatusBreakdownPoint[], isWorkingDay: (date: string) => boolean): number[] {
    const total = computeTotal(points);
    const workingDayCount = points.filter((point) => isWorkingDay(point.date)).length;
    const step = workingDayCount > 0 ? total / workingDayCount : 0;

    let cumulativeWorkingDays = 0;
    return points.map((point) => {
        if (isWorkingDay(point.date)) {
            cumulativeWorkingDays += 1;
        }
        const ideal = workingDayCount > 0 ? Math.max(0, total - step * cumulativeWorkingDays) : total;
        return Math.round(ideal * 10) / 10;
    });
}

/**
 * computes basic burndown chart points (actual vs ideal remaining)
 *
 * @param points status breakdown points
 * @param isWorkingDay predicate to check if a date is a working day
 * @returns array of burndown points
 */
export function computeBurndownPoints(points: StatusBreakdownPoint[], isWorkingDay: (date: string) => boolean) {
    if (points.length === 0) {
        return [];
    }

    const total = computeTotal(points);
    const idealSeries = computeIdealSeries(points, isWorkingDay);

    return points.map((point, index) => {
        const actual = total - (point.counts["DONE"] ?? 0);
        return { date: point.date, actual, ideal: idealSeries[index] } as BurndownPoint;
    });
}

/**
 * computes advanced burndown chart points with milestone breakdown
 *
 * for each milestone, counts how many items have not yet reached it
 *
 * @param points status breakdown points
 * @param allStatusesOrdered all statuses in rank order
 * @param milestones milestone statuses to track
 * @param isWorkingDay predicate to check if a date is a working day
 * @returns array of advanced burndown points
 */
export function computeAdvancedBurndownPoints(
    points: StatusBreakdownPoint[],
    allStatusesOrdered: string[],
    milestones: SubtaskStatus[],
    isWorkingDay: (date: string) => boolean
) {
    if (points.length === 0) {
        return [];
    }

    const total = computeTotal(points);
    const idealSeries = computeIdealSeries(points, isWorkingDay);

    return points.map((point, index) => {
        const counts: Record<string, number> = {};
        for (const milestone of milestones) {
            const milestoneIndex = allStatusesOrdered.indexOf(milestone);
            const atOrBeyond = allStatusesOrdered
                .slice(milestoneIndex)
                .reduce((sum, status) => sum + (point.counts[status] ?? 0), 0);
            counts[milestone] = total - atOrBeyond;
        }
        return { date: point.date, ideal: idealSeries[index], counts } as AdvancedBurndownPoint;
    });
}
