import { formatIsoDate } from "./calendarGrid";

interface StoryIdentity {
    id: number;
    jiraKey: string | null;
}

function storyIdentifier(story: StoryIdentity) {
    return story.jiraKey ?? `story-${story.id}`;
}

export function buildStoryPdfFilename(story: StoryIdentity) {
    return `${storyIdentifier(story)}-export-${formatIsoDate(new Date())}.pdf`;
}

export function buildSubtaskPdfFilename(story: StoryIdentity, subtaskNumber: number) {
    return `${storyIdentifier(story)}-subtask-${subtaskNumber}-export-${formatIsoDate(new Date())}.pdf`;
}
