import { describe, it, expect, beforeEach } from "vitest";
import type { MarkdownExportFields } from "@shared/types";
import rawExportFieldsJson from "../../static/export_fields.json";
import { defaultExportFields, loadExportFields, saveExportFields } from "./exportFields";

const staticDefaults = rawExportFieldsJson as MarkdownExportFields;

beforeEach(() => {
    localStorage.clear();
});

describe("defaultExportFields", () => {
    it("matches static/export_fields.json - the single source of truth for defaults", () => {
        expect(defaultExportFields()).toEqual(staticDefaults);
    });

    it("only the common fields (identifying info, status, branch/PR) default to included", () => {
        const fields = defaultExportFields();
        expect(fields.story).toMatchObject({ jiraKey: true, title: true, status: true });
        expect(fields.story).toMatchObject({ tags: false, awaitingMoreSubtasks: false });
        expect(fields.subtask).toMatchObject({ title: true, branchName: true, prUrl: true, status: true });
        expect(fields.subtask).toMatchObject({
            comment: false,
            repoName: false,
            complexityRating: false,
            releaseVersion: false,
            createdAt: false,
        });
    });

    it("returns a fresh copy each time, not a shared reference to the static json", () => {
        const first = defaultExportFields();
        first.story.title = false;
        expect(defaultExportFields().story.title).toBe(true);
    });
});

describe("loadExportFields", () => {
    it("returns the defaults when nothing has been saved yet", () => {
        expect(loadExportFields()).toEqual(defaultExportFields());
    });

    it("round-trips whatever was last saved", () => {
        const fields = defaultExportFields();
        fields.subtask.comment = true;
        fields.story.tags = true;
        saveExportFields(fields);

        expect(loadExportFields()).toEqual(fields);
    });

    it("fills in missing fields with defaults, for forward-compatibility with new fields", () => {
        localStorage.setItem("sprint-tracker:export-fields", JSON.stringify({ story: { title: false } }));
        const loaded = loadExportFields();
        expect(loaded.story.title).toBe(false);
        expect(loaded.story.status).toBe(true);
        expect(loaded.subtask).toEqual(defaultExportFields().subtask);
    });

    it("falls back to defaults if the stored value is not valid json", () => {
        localStorage.setItem("sprint-tracker:export-fields", "not json");
        expect(loadExportFields()).toEqual(defaultExportFields());
    });
});
