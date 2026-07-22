import { formatIsoDate } from "./calendarGrid";

interface StoryIdentity {
    id: number;
    jiraKey: string | null;
}

function storyIdentifier(story: StoryIdentity) {
    return story.jiraKey ?? `story-${story.id}`;
}

/**
 * builds a PDF filename for a story export
 *
 * @param story story identity (ID and JIRA key)
 * @returns filename string
 */
export function buildStoryPdfFilename(story: StoryIdentity) {
    return `${storyIdentifier(story)}-export-${formatIsoDate(new Date())}.pdf`;
}

/**
 * builds a PDF filename for a subtask export
 *
 * @param story parent story identity (ID and JIRA key)
 * @param subtaskNumber subtask number within the story
 * @returns filename string
 */
export function buildSubtaskPdfFilename(story: StoryIdentity, subtaskNumber: number) {
    return `${storyIdentifier(story)}-subtask-${subtaskNumber}-export-${formatIsoDate(new Date())}.pdf`;
}
