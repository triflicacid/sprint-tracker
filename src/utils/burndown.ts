import type { StatusBreakdownPoint, SubtaskStatus } from "@shared/types";

export interface BurndownPoint {
    date: string;
    actual: number;
    ideal: number;
}

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

// ideal remaining, rounded, one entry per point - shared by the basic and
// advanced charts so both compare against the exact same reference line.
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

// for each day, and for each milestone status (e.g. NEW/TESTING/UAT/DONE), counts
// how many items have NOT YET reached the milestone (i.e. total minus everything
// at or beyond the milestone's position in `allStatusesOrdered` - the app's
// existing rank order, SUBTASK_STATUSES or STORY_STATUSES depending on
// granularity). Each milestone's line burns down toward 0 just like the basic
// chart's actual line (which is exactly the DONE milestone), so all of them -
// plus the shared ideal line - read on the same "remaining work" axis.
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
