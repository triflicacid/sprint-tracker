import { describe, it, expect } from "vitest";
import { isSprintLocked } from "./sprintLock.js";

function offsetFromToday(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

describe("is sprint locked", () => {
    it("is not locked when end date is null", () => {
        expect(isSprintLocked({ endDate: null })).toBe(false);
    });

    it("is locked when end date is in the past", () => {
        expect(isSprintLocked({ endDate: offsetFromToday(-1) })).toBe(true);
    });

    it("is not locked when end date is today", () => {
        expect(isSprintLocked({ endDate: offsetFromToday(0) })).toBe(false);
    });

    it("is not locked when end date is in the future", () => {
        expect(isSprintLocked({ endDate: offsetFromToday(1) })).toBe(false);
    });
});
