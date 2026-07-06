import { describe, it, expect, beforeEach } from "vitest";
import { defaultExportFields, loadExportFields, saveExportFields } from "./exportFields";

beforeEach(() => {
    localStorage.clear();
});

describe("defaultExportFields", () => {
    it("defaults every story and subtask field to true", () => {
        const fields = defaultExportFields();
        expect(Object.values(fields.story).every((value) => value === true)).toBe(true);
        expect(Object.values(fields.subtask).every((value) => value === true)).toBe(true);
    });
});

describe("loadExportFields", () => {
    it("returns the defaults when nothing has been saved yet", () => {
        expect(loadExportFields()).toEqual(defaultExportFields());
    });

    it("round-trips whatever was last saved", () => {
        const fields = defaultExportFields();
        fields.subtask.comment = false;
        fields.story.tags = false;
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
