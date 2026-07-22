import type { DayActivityEntry } from "@shared/types";

/**
 * collapses a day's per-subtask activity entries down to one per story
 *
 * multi-subtask stories lose branch name/PR link in favor of "N subtasks" hint
 *
 * @param activities array of activity entries
 * @returns array of story-grouped activity entries
 */
export function groupActivitiesByStory(activities: DayActivityEntry[]): DayActivityEntry[] {
    const byStory = new Map<number, DayActivityEntry[]>();
    for (const entry of activities) {
        const group = byStory.get(entry.storyId);
        if (group) {
            group.push(entry);
        } else {
            byStory.set(entry.storyId, [entry]);
        }
    }

    return Array.from(byStory.values()).map((group) => {
        const [first] = group;
        return {
            storyId: first.storyId,
            storyLabel: first.storyLabel,
            branchName: group.length === 1 ? first.branchName : `${group.length} subtasks`,
            status: first.status,
            prUrl: group.length === 1 ? first.prUrl : null,
        };
    });
}
