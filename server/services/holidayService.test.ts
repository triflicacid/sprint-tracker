import { describe, it, expect } from "vitest";
import { listHolidaysInRange, addHoliday, removeHoliday } from "./holidayService.js";

describe("addHoliday / listHolidaysInRange", () => {
    it("adds a holiday and lists it back within range", () => {
        addHoliday("2026-03-06");
        expect(listHolidaysInRange("2026-03-01", "2026-03-31")).toEqual(["2026-03-06"]);
    });

    it("excludes holidays outside the requested range", () => {
        addHoliday("2026-03-06");
        addHoliday("2026-04-01");
        expect(listHolidaysInRange("2026-03-01", "2026-03-31")).toEqual(["2026-03-06"]);
    });

    it("returns holidays in ascending date order", () => {
        addHoliday("2026-03-09");
        addHoliday("2026-03-06");
        expect(listHolidaysInRange("2026-03-01", "2026-03-31")).toEqual(["2026-03-06", "2026-03-09"]);
    });

    it("adding the same date twice does not create a duplicate", () => {
        addHoliday("2026-03-06");
        addHoliday("2026-03-06");
        expect(listHolidaysInRange("2026-03-01", "2026-03-31")).toEqual(["2026-03-06"]);
    });
});

describe("removeHoliday", () => {
    it("removes a previously added holiday", () => {
        addHoliday("2026-03-06");
        removeHoliday("2026-03-06");
        expect(listHolidaysInRange("2026-03-01", "2026-03-31")).toEqual([]);
    });

    it("is a no-op for a date that was never a holiday", () => {
        expect(() => removeHoliday("2026-03-06")).not.toThrow();
    });
});
