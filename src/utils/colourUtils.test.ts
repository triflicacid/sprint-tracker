import { describe, it, expect } from "vitest";
import { hexToRgb } from "./colourUtils";

describe("hexToRgb", () => {
    it("converts a pure-red hex to [255, 0, 0]", () => {
        expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
    });

    it("converts a pure-green hex to [0, 255, 0]", () => {
        expect(hexToRgb("#00ff00")).toEqual([0, 255, 0]);
    });

    it("converts a pure-blue hex to [0, 0, 255]", () => {
        expect(hexToRgb("#0000ff")).toEqual([0, 0, 255]);
    });

    it("converts black to [0, 0, 0]", () => {
        expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    });

    it("converts white to [255, 255, 255]", () => {
        expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
    });

    it("converts a realistic UI color correctly", () => {
        // #e5484d (bugfix red) => r=229, g=72, b=77
        expect(hexToRgb("#e5484d")).toEqual([229, 72, 77]);
    });

    it("handles uppercase hex digits", () => {
        expect(hexToRgb("#FF0000")).toEqual([255, 0, 0]);
    });

    it("returns a tuple of exactly three numbers", () => {
        const result = hexToRgb("#22a6b3");
        expect(result).toHaveLength(3);
        result.forEach((v) => expect(typeof v).toBe("number"));
    });
});

