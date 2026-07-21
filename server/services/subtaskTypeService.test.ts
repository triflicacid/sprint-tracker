import { describe, it, expect } from "vitest";
import { getSubtaskTypes, isValidSubtaskType } from "./subtaskTypeService.js";

describe("getSubtaskTypes", () => {
    it("returns an array of type entries", () => {
        const types = getSubtaskTypes();
        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0);
    });

    it("includes 'unknown' as the first entry and marks it non-selectable", () => {
        const types = getSubtaskTypes();
        const unknown = types.find((t) => t.shortName === "unknown");
        expect(unknown).toBeDefined();
        expect(unknown?.selectable).toBe(false);
    });

    it("includes all expected basic-tier types", () => {
        const types = getSubtaskTypes();
        const basicTypes = types.filter((t) => t.tier === "basic").map((t) => t.shortName);
        expect(basicTypes).toEqual(expect.arrayContaining(["feature", "bugfix", "tech-debt", "spike"]));
    });

    it("includes all expected advanced-tier types", () => {
        const types = getSubtaskTypes();
        const advancedTypes = types.filter((t) => t.tier === "advanced").map((t) => t.shortName);
        expect(advancedTypes).toEqual(expect.arrayContaining(["chore", "docs", "test", "security", "perf"]));
    });

    it("every entry has shortName, fullName, and description", () => {
        const types = getSubtaskTypes();
        for (const type of types) {
            expect(type.shortName).toBeTruthy();
            expect(type.fullName).toBeTruthy();
            expect(type.description).toBeTruthy();
        }
    });
});

describe("isValidSubtaskType", () => {
    it("returns true for 'unknown'", () => {
        expect(isValidSubtaskType("unknown")).toBe(true);
    });

    it("returns true for every selectable type in the json file", () => {
        const types = getSubtaskTypes().filter((t) => t.selectable !== false);
        for (const type of types) {
            expect(isValidSubtaskType(type.shortName)).toBe(true);
        }
    });

    it("returns false for a completely unknown string", () => {
        expect(isValidSubtaskType("not-a-real-type")).toBe(false);
    });

    it("returns false for an empty string", () => {
        expect(isValidSubtaskType("")).toBe(false);
    });

    it("is case-sensitive (uppercase is not valid)", () => {
        expect(isValidSubtaskType("Feature")).toBe(false);
        expect(isValidSubtaskType("BUGFIX")).toBe(false);
    });
});

