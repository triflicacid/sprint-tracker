import type { ComplexityTimingPoint } from "@shared/types";

export const COMPLEXITY_RATINGS = [1, 2, 3, 4, 5];

/**
 * average running time for a complexity rating
 */
export interface ComplexityAveragePoint {
    complexityRating: number;
    runningTimeDays: number;
    pointCount: number;
    isAverage: true;
}

/**
 * calculates average running time for each complexity rating
 *
 * @param points complexity timing points
 * @returns array of average points
 */
export function averageRunningTimeByComplexity(points: ComplexityTimingPoint[]): ComplexityAveragePoint[] {
    const totals = new Map<number, { sum: number; count: number }>();
    for (const point of points) {
        const entry = totals.get(point.complexityRating) ?? { sum: 0, count: 0 };
        entry.sum += point.runningTimeDays;
        entry.count += 1;
        totals.set(point.complexityRating, entry);
    }
    return Array.from(totals.entries())
        .map(([complexityRating, { sum, count }]) => ({
            complexityRating,
            runningTimeDays: Math.round((sum / count) * 10) / 10,
            pointCount: count,
            isAverage: true as const,
        }))
        .sort((a, b) => a.complexityRating - b.complexityRating);
}

/**
 * groups complexity/running-time points by story
 *
 * @param points complexity timing points
 * @returns array of grouped story points
 */
export function groupPointsByStory(points: ComplexityTimingPoint[]) {
    const byStory = new Map<number, { storyId: number; storyLabel: string; points: ComplexityTimingPoint[] }>();
    for (const point of points) {
        const existing = byStory.get(point.storyId);
        if (existing) {
            existing.points.push(point);
        } else {
            byStory.set(point.storyId, { storyId: point.storyId, storyLabel: point.storyLabel, points: [point] });
        }
    }
    return Array.from(byStory.values());
}
