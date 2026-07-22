import { describe, it, expect } from "vitest";
import { generateBranchName } from "./branchName";

describe("generateBranchName", () => {
    it("normalizes the category to lowercase kebab-case", () => {
        expect(generateBranchName("Tech Debt", "NEB-1234", "cleanup old code")).toBe(
            "tech-debt/NEB-1234-cleanup-old-code"
        );
    });

    it("slugifies the title and strips punctuation", () => {
        expect(generateBranchName("feature", "NEB-1234", "New cash payment option!!!")).toBe(
            "feature/NEB-1234-new-cash-payment-option"
        );
    });

    it("omits the jira key segment when no jira key is available", () => {
        expect(generateBranchName("bugfix", null, "Fix login loop")).toBe("bugfix/fix-login-loop");
    });

    it("falls back to just the category and jira key when the title is empty", () => {
        expect(generateBranchName("feature", "NEB-1234", "   ")).toBe("feature/NEB-1234");
    });

    it("collapses repeated separators in both the category and title", () => {
        expect(generateBranchName("Feature / API", "NEB-1234", "fix---legacy   endpoint")).toBe(
            "feature-api/NEB-1234-fix-legacy-endpoint"
        );
    });
});

