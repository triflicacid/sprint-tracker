import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SubtaskTypeIcon, SUBTASK_TYPE_COLORS, formatSubtaskTypeName, renderTypeIconInSvg } from "./SubtaskTypeIcon";

describe("SUBTASK_TYPE_COLORS", () => {
    it("has an entry for every expected type", () => {
        const expectedTypes = ["unknown", "feature", "bugfix", "tech-debt", "spike", "chore", "docs", "test", "security", "perf"];
        for (const type of expectedTypes) {
            expect(SUBTASK_TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });
});

describe("formatSubtaskTypeName", () => {
    it("capitalises the first letter", () => {
        expect(formatSubtaskTypeName("feature")).toBe("Feature");
    });

    it("replaces hyphens with spaces", () => {
        expect(formatSubtaskTypeName("tech-debt")).toBe("Tech debt");
    });

    it("handles single-word types", () => {
        expect(formatSubtaskTypeName("bugfix")).toBe("Bugfix");
        expect(formatSubtaskTypeName("spike")).toBe("Spike");
    });

    it("handles 'unknown'", () => {
        expect(formatSubtaskTypeName("unknown")).toBe("Unknown");
    });
});

describe("SubtaskTypeIcon", () => {
    it("renders an svg with a title matching the type for 'unknown'", () => {
        render(<SubtaskTypeIcon type="unknown" />);
        expect(document.querySelector("svg.subtask-type-icon title")?.textContent).toBe("unknown");
    });

    it("renders an svg with a title matching the type for 'feature'", () => {
        render(<SubtaskTypeIcon type="feature" />);
        expect(document.querySelector("svg.subtask-type-icon title")?.textContent).toBe("feature");
    });

    it("renders an svg with a title matching the type for 'bugfix'", () => {
        render(<SubtaskTypeIcon type="bugfix" />);
        expect(document.querySelector("svg.subtask-type-icon title")?.textContent).toBe("bugfix");
    });

    it("renders an svg with a title matching the type for 'tech-debt'", () => {
        render(<SubtaskTypeIcon type="tech-debt" />);
        expect(document.querySelector("svg.subtask-type-icon title")?.textContent).toBe("tech-debt");
    });

    it("renders an svg with a title matching the type for 'spike'", () => {
        render(<SubtaskTypeIcon type="spike" />);
        expect(document.querySelector("svg.subtask-type-icon title")?.textContent).toBe("spike");
    });

    it("renders an svg for all other selectable types", () => {
        const types = ["chore", "docs", "test", "security", "perf"];
        for (const type of types) {
            const { unmount } = render(<SubtaskTypeIcon type={type} />);
            expect(document.querySelector("svg.subtask-type-icon title")?.textContent).toBe(type);
            unmount();
        }
    });

    it("returns null for an unrecognised type", () => {
        const { container } = render(<SubtaskTypeIcon type="not-a-type" />);
        expect(container.firstChild).toBeNull();
    });

    it("applies the subtask-type-icon class on every recognised type", () => {
        const recognisedTypes = ["unknown", "feature", "bugfix", "tech-debt", "spike", "chore", "docs", "test", "security", "perf"];
        for (const type of recognisedTypes) {
            const { container, unmount } = render(<SubtaskTypeIcon type={type} />);
            expect(container.querySelector("svg.subtask-type-icon")).not.toBeNull();
            unmount();
        }
    });
});

describe("renderTypeIconInSvg", () => {
    it("returns a ReactElement for all recognised types", () => {
        const types = ["unknown", "feature", "bugfix", "tech-debt", "spike", "chore", "docs", "test", "security", "perf"];
        for (const type of types) {
            const result = renderTypeIconInSvg(type, 0, 0, 18);
            expect(result).not.toBeNull();
        }
    });

    it("returns null for an unrecognised type", () => {
        expect(renderTypeIconInSvg("not-real", 0, 0, 18)).toBeNull();
    });

    it("positions the icon at the supplied x/y with the supplied size", () => {
        const element = renderTypeIconInSvg("feature", 10, 20, 24);
        expect((element?.props as any)?.x).toBe(10);
        expect((element?.props as any)?.y).toBe(20);
        expect((element?.props as any)?.width).toBe(24);
        expect((element?.props as any)?.height).toBe(24);
    });
});


