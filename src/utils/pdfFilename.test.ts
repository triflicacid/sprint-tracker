import { describe, it, expect } from "vitest";
import { buildStoryPdfFilename, buildSubtaskPdfFilename } from "./pdfFilename";

describe("buildStoryPdfFilename", () => {
    it("uses the story's jira key rather than its internal id", () => {
        expect(buildStoryPdfFilename({ id: 42, jiraKey: "NEB-143" })).toMatch(
            /^NEB-143-export-\d{4}-\d{2}-\d{2}\.pdf$/
        );
    });

    it("falls back to the internal id when there is no jira key yet", () => {
        expect(buildStoryPdfFilename({ id: 42, jiraKey: null })).toMatch(/^story-42-export-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
});

describe("buildSubtaskPdfFilename", () => {
    it("combines the story's jira key with the subtask's position in that story", () => {
        expect(buildSubtaskPdfFilename({ id: 42, jiraKey: "NEB-143" }, 2)).toMatch(
            /^NEB-143-subtask-2-export-\d{4}-\d{2}-\d{2}\.pdf$/
        );
    });

    it("falls back to the internal story id when there is no jira key yet", () => {
        expect(buildSubtaskPdfFilename({ id: 42, jiraKey: null }, 1)).toMatch(
            /^story-42-subtask-1-export-\d{4}-\d{2}-\d{2}\.pdf$/
        );
    });
});
