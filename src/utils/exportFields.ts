import type { MarkdownExportFields } from "@shared/types";
import rawDefaultExportFields from "../../static/export_fields.json";

const STORAGE_KEY = "sprint-tracker:export-fields";

/**
 * returns default export field configuration
 *
 * @returns default export fields
 */
export function defaultExportFields() {
    const defaults = rawDefaultExportFields as MarkdownExportFields;
    return {
        story: { ...defaults.story },
        subtask: { ...defaults.subtask },
    } as MarkdownExportFields;
}

/**
 * loads export fields from localStorage, falling back to defaults
 *
 * @returns export fields configuration
 */
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

/**
 * saves export fields to localStorage
 *
 * @param fields export fields configuration to save
 */
export function saveExportFields(fields: MarkdownExportFields) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}
