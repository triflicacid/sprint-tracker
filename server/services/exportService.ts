import type { MarkdownExportFields, StoryDetail, StoryStatus, Subtask } from "../../shared/types.js";
import { getSprintDetail } from "./sprintService.js";
import { getStoryDetail } from "./storyService.js";
import { getStatusFlow } from "./statusFlowService.js";

function labelOf(status: StoryStatus): string {
    const state = getStatusFlow().states.find((entry) => entry.id === status);
    if (state) {
        return state.label;
    }
    if (status === "JIRA_ONLY") {
        return "jira only";
    }
    if (status === "WORK_REMAINING") {
        return "work remaining";
    }
    return status.toLowerCase();
}

function formatSubtask(subtask: Subtask, fields: MarkdownExportFields["subtask"]) {
    const identity = fields.title ? subtask.title : `Subtask ${subtask.id}`;
    let heading = `- ${identity}`;
    if (fields.status) {
        heading += ` [${labelOf(subtask.status)}]`;
    }

    // branch and PR link share one sub-bullet ("branch @ pr link")
    const detailLines: string[] = [];
    if (fields.branchName) {
        const branch = fields.prUrl && subtask.url ? `${subtask.branchName} @ ${subtask.url}` : subtask.branchName;
        detailLines.push(`branch: ${branch}`);
    } else if (fields.prUrl && subtask.url) {
        detailLines.push(`PR: ${subtask.url}`);
    }
    if (fields.repoName && subtask.repoName) {
        detailLines.push(`repo: ${subtask.repoName}`);
    }
    if (fields.complexityRating && subtask.complexityRating !== null) {
        detailLines.push(`complexity: ${subtask.complexityRating}`);
    }
    if (fields.releaseVersion && subtask.releaseVersion) {
        detailLines.push(`release: ${subtask.releaseVersion}`);
    }
    if (fields.createdAt) {
        detailLines.push(`created: ${subtask.createdAt}`);
    }

    const lines = [heading, ...detailLines.map((detail) => `  - ${detail}`)];
    if (fields.comment && subtask.comment) {
        lines.push(`  > ${subtask.comment}`);
    }
    return lines.join("\n");
}

function formatStory(story: StoryDetail, fields: MarkdownExportFields) {
    const identityParts: string[] = [];
    if (fields.story.jiraKey) {
        identityParts.push(story.jiraKey ?? story.jiraUrl);
    }
    if (fields.story.title) {
        identityParts.push(story.jiraTitle ?? story.description);
    }
    const identity = identityParts.length > 0 ? identityParts.join(": ") : `Story ${story.id}`;

    let heading = `## ${identity}`;
    if (fields.story.status) {
        heading += ` [${labelOf(story.status)}]`;
    }

    const lines: string[] = [heading];
    if (fields.story.tags && story.tags.length > 0) {
        lines.push(`tags: ${story.tags.map((tag) => tag.name).join(", ")}`);
    }
    if (fields.story.awaitingMoreSubtasks && story.awaitingMoreSubtasks) {
        lines.push("awaiting more subtasks: yes");
    }

    const subtaskLines = story.subtasks.map((subtask) => formatSubtask(subtask, fields.subtask));
    return [...lines, "", ...subtaskLines].join("\n");
}

// builds one markdown document covering every given sprint in the order given
export function buildMarkdownExport(sprintIds: number[], fields: MarkdownExportFields) {
    const sections: string[] = [];
    for (const sprintId of sprintIds) {
        const sprint = getSprintDetail(sprintId);
        if (!sprint) {
            continue;
        }
        const heading = `# ${sprint.name} (${sprint.startDate} – ${sprint.endDate ?? "present"})`;
        const storyBlocks = sprint.stories
            .map((story) => getStoryDetail(story.id))
            .filter((story): story is StoryDetail => story !== null)
            .map((story) => formatStory(story, fields));
        sections.push([heading, ...storyBlocks].join("\n\n"));
    }
    return sections.join("\n\n---\n\n");
}
