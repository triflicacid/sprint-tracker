import type { DayActivityEntry } from "@shared/types";

// collapses a day's per-subtask activity entries down to one per story -
// "which stories did I touch today" rather than "which of their
// subtasks/branches did I touch". a story with more than one active
// subtask that day loses its single branch name/pr link (ambiguous once
// merged) in favor of a "N subtasks" hint; a single-subtask story keeps
// its branch name and pr link unchanged.
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
