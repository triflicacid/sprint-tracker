import type { MarkdownExportFields } from "@shared/types";

const STORAGE_KEY = "sprint-tracker:export-fields";

// every field defaults to included.
export function defaultExportFields(): MarkdownExportFields {
    return {
        story: {
            jiraKey: true,
            title: true,
            status: true,
            tags: true,
            awaitingMoreSubtasks: true,
        },
        subtask: {
            title: true,
            comment: true,
            branchName: true,
            prUrl: true,
            status: true,
            repoName: true,
            complexityRating: true,
            releaseVersion: true,
            createdAt: true,
        },
    };
}

// used both by the export page (as the initial state) and by the
// per-sprint quick-export button (which has no picker of its own, so it
// exports with whatever was last saved here, or the defaults).
export function loadExportFields(): MarkdownExportFields {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return defaultExportFields();
    }
    try {
        const parsed = JSON.parse(raw);
        return {
            story: { ...defaultExportFields().story, ...parsed.story },
            subtask: { ...defaultExportFields().subtask, ...parsed.subtask },
        };
    } catch {
        return defaultExportFields();
    }
}

export function saveExportFields(fields: MarkdownExportFields): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}
