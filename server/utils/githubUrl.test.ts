import { describe, it, expect } from "vitest";
import { extractRepoName, extractJiraKey } from "./githubUrl.js";

describe("extractRepoName", () => {
    it("extracts the repo name from a github pull request url", () => {
        expect(extractRepoName("https://github.com/nebula-labs/payments-service/pull/214")).toBe(
            "payments-service"
        );
    });

    it("falls back to unknown-repo for a non-matching url", () => {
        expect(extractRepoName("https://example.com/not-a-pr")).toBe("unknown-repo");
    });

    it("falls back to unknown-repo for an empty string", () => {
        expect(extractRepoName("")).toBe("unknown-repo");
    });
});

describe("extractJiraKey", () => {
    it("extracts a jira issue key from a browse url", () => {
        expect(extractJiraKey("https://nebula.atlassian.net/browse/NEB-1001")).toBe("NEB-1001");
    });

    it("returns null for a url with no browse segment", () => {
        expect(extractJiraKey("https://nebula.atlassian.net/issues/NEB-1001")).toBeNull();
    });

    it("returns null for a malformed key (lowercase project)", () => {
        expect(extractJiraKey("https://nebula.atlassian.net/browse/neb-1001")).toBeNull();
    });
});
