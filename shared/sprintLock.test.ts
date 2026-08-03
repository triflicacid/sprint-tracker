import { describe, it, expect } from "vitest";
import { isSprintLocked, isStoryEffectivelyLocked, isSubtaskEffectivelyLocked } from "./sprintLock.js";

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

describe("is story effectively locked", () => {
    it("is locked when the sprint has ended, regardless of the manual flag", () => {
        expect(isStoryEffectivelyLocked({ endDate: offsetFromToday(-1) }, { locked: false })).toBe(true);
    });

    it("is locked when manually locked even while the sprint is still open", () => {
        expect(isStoryEffectivelyLocked({ endDate: offsetFromToday(1) }, { locked: true })).toBe(true);
    });

    it("is unlocked when the sprint is open and the manual flag is off", () => {
        expect(isStoryEffectivelyLocked({ endDate: offsetFromToday(1) }, { locked: false })).toBe(false);
    });
});

describe("is subtask effectively locked", () => {
    it("is locked when the sprint has ended", () => {
        expect(
            isSubtaskEffectivelyLocked({ endDate: offsetFromToday(-1) }, { locked: false }, { locked: false })
        ).toBe(true);
    });

    it("is locked when the parent story is manually locked", () => {
        expect(
            isSubtaskEffectivelyLocked({ endDate: offsetFromToday(1) }, { locked: true }, { locked: false })
        ).toBe(true);
    });

    it("is locked when the subtask itself is manually locked", () => {
        expect(
            isSubtaskEffectivelyLocked({ endDate: offsetFromToday(1) }, { locked: false }, { locked: true })
        ).toBe(true);
    });

    it("is unlocked when the sprint is open and neither the story nor the subtask is manually locked", () => {
        expect(
            isSubtaskEffectivelyLocked({ endDate: offsetFromToday(1) }, { locked: false }, { locked: false })
        ).toBe(false);
    });
});
