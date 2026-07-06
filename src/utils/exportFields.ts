import type { MarkdownExportFields } from "@shared/types";
import rawDefaultExportFields from "../../static/exportFields.json";

const STORAGE_KEY = "sprint-tracker:export-fields";

export function defaultExportFields() {
    const defaults = rawDefaultExportFields as MarkdownExportFields;
    return {
        story: { ...defaults.story },
        subtask: { ...defaults.subtask },
    } as MarkdownExportFields;
}

export function loadExportFields() {
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

export function saveExportFields(fields: MarkdownExportFields) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}
