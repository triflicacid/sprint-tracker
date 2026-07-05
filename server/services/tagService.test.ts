import { describe, it, expect } from "vitest";
import {
    findOrCreateTag,
    attachTag,
    tagStoryWithRepo,
    getTagsForEntity,
    getAllTags,
    removeTag,
} from "./tagService.js";

describe("findOrCreateTag", () => {
    it("creates a new tag when none exists", () => {
        const tag = findOrCreateTag("checkout-web", "repo");
        expect(tag.name).toBe("checkout-web");
        expect(tag.tagType).toBe("repo");
        expect(tag.id).toBeGreaterThan(0);
    });

    it("returns the existing tag on a second call instead of creating a duplicate", () => {
        const first = findOrCreateTag("checkout-web", "repo");
        const second = findOrCreateTag("checkout-web", "repo");
        expect(second.id).toBe(first.id);
        expect(getAllTags()).toHaveLength(1);
    });
});

describe("attachTag / getTagsForEntity", () => {
    it("attaches a tag to an entity and lists it back", () => {
        const tag = findOrCreateTag("payments", "custom");
        attachTag("story", 1, tag.id);
        expect(getTagsForEntity("story", 1)).toEqual([tag]);
    });

    it("attaching the same tag twice does not duplicate the association", () => {
        const tag = findOrCreateTag("payments", "custom");
        attachTag("story", 1, tag.id);
        attachTag("story", 1, tag.id);
        expect(getTagsForEntity("story", 1)).toHaveLength(1);
    });

    it("scopes tags to the given entity type and id", () => {
        const tag = findOrCreateTag("payments", "custom");
        attachTag("story", 1, tag.id);
        expect(getTagsForEntity("story", 2)).toEqual([]);
        expect(getTagsForEntity("subtask", 1)).toEqual([]);
    });
});

describe("tagStoryWithRepo", () => {
    it("finds-or-creates a repo tag and attaches it to the story", () => {
        tagStoryWithRepo(5, "checkout-web");
        const tags = getTagsForEntity("story", 5);
        expect(tags).toHaveLength(1);
        expect(tags[0]).toMatchObject({ name: "checkout-web", tagType: "repo" });
    });
});

describe("removeTag", () => {
    it("detaches a tag from an entity without deleting the tag itself", () => {
        const tag = findOrCreateTag("payments", "custom");
        attachTag("story", 1, tag.id);
        removeTag("story", 1, tag.id);
        expect(getTagsForEntity("story", 1)).toEqual([]);
        expect(getAllTags()).toEqual([tag]);
    });
});

describe("getAllTags", () => {
    it("lists every tag alphabetically", () => {
        findOrCreateTag("zeta", "custom");
        findOrCreateTag("alpha", "repo");
        expect(getAllTags().map((tag) => tag.name)).toEqual(["alpha", "zeta"]);
    });
});
