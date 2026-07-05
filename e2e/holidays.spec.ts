import { test, expect, Page } from "@playwright/test";
import { seedSprint } from "./seed.js";

// Holidays toggle from two surfaces - chips on the sprint detail page, and
// clicks on the stats page's calendar - both against the same underlying
// set, so a change on one must show up on the other. Each test uses its
// own fixed, non-overlapping mon-fri range: the range-calendar page renders
// every sprint in the shared, serial-run db at once, so overlapping ranges
// across these tests would inflate lane counts and break
// range-calendar.spec's assertions.
function calendarCellFor(page: Page, isoDate: string) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
    const monthBlock = page.locator(".calendar-month").filter({ hasText: monthLabel });
    return monthBlock.locator(".calendar-day").filter({
        has: page.locator(".calendar-day-number", { hasText: new RegExp(`^${day}$`) }),
    });
}

async function holidaysStatValue(page: Page): Promise<string> {
    const label = page.getByText("holidays", { exact: true });
    return (await label.locator("xpath=preceding-sibling::span[1]").textContent()) ?? "";
}

test.describe("holiday days", () => {
    test("adding a holiday on the sprint page shows up as a holiday cell and count on the stats page, and removing it reverts both", async ({
        page,
        request,
    }) => {
        const holidayDate = "2026-08-05"; // wednesday, inside mon 08-03 - fri 08-14
        const sprint = await seedSprint(request, {
            name: `E2E Holiday A ${Date.now()}`,
            startDate: "2026-08-03",
            endDate: "2026-08-14",
        });

        await page.goto(`/#/sprints/${sprint.id}`);
        await page.fill('input[type="date"]', holidayDate);
        await page.click("text=add holiday");

        const chip = page.locator(".holiday-chip", { hasText: holidayDate });
        await expect(chip).toBeVisible();

        await page.goto(`/#/stats?sprintId=${sprint.id}`);
        const cell = calendarCellFor(page, holidayDate);
        await expect(cell).toHaveClass(/calendar-day-holiday/);
        await expect(await holidaysStatValue(page)).toBe("1");

        await page.goto(`/#/sprints/${sprint.id}`);
        await expect(page.locator(".holiday-chip", { hasText: holidayDate })).toBeVisible();
        await page.locator(".holiday-chip", { hasText: holidayDate }).locator(".holiday-remove").click();
        await expect(page.locator(".holiday-chip", { hasText: holidayDate })).toHaveCount(0);

        await page.goto(`/#/stats?sprintId=${sprint.id}`);
        const cellAfterRemoval = calendarCellFor(page, holidayDate);
        await expect(cellAfterRemoval).toHaveClass(/calendar-day-active/);
        await expect(await holidaysStatValue(page)).toBe("0");
    });

    test("toggling a holiday on the stats calendar shows up as a removable chip on the sprint page", async ({
        page,
        request,
    }) => {
        const holidayDate = "2026-09-09"; // wednesday, inside mon 09-07 - fri 09-18
        const sprint = await seedSprint(request, {
            name: `E2E Holiday B ${Date.now()}`,
            startDate: "2026-09-07",
            endDate: "2026-09-18",
        });

        await page.goto(`/#/stats?sprintId=${sprint.id}`);
        const cell = calendarCellFor(page, holidayDate);
        await expect(cell).toHaveClass(/calendar-day-active/);
        await cell.click();
        await expect(cell).toHaveClass(/calendar-day-holiday/);

        await page.goto(`/#/sprints/${sprint.id}`);
        const chip = page.locator(".holiday-chip", { hasText: holidayDate });
        await expect(chip).toBeVisible();

        await chip.locator(".holiday-remove").click();
        await expect(page.locator(".holiday-chip", { hasText: holidayDate })).toHaveCount(0);

        await page.goto(`/#/stats?sprintId=${sprint.id}`);
        await expect(calendarCellFor(page, holidayDate)).toHaveClass(/calendar-day-active/);
    });

    test("a weekend day cannot be toggled into a holiday from the stats calendar", async ({ page, request }) => {
        const sprint = await seedSprint(request, {
            name: `E2E Holiday C ${Date.now()}`,
            startDate: "2026-10-05",
            endDate: "2026-10-16",
        });

        await page.goto(`/#/stats?sprintId=${sprint.id}`);

        // 2026-10-10 is a saturday inside the sprint's own month block - muted
        // for being a weekend, not for falling outside the sprint range.
        const weekendCell = calendarCellFor(page, "2026-10-10");
        await expect(weekendCell).toHaveClass(/calendar-day-muted/);
        await weekendCell.click({ force: true });
        await expect(weekendCell).toHaveClass(/calendar-day-muted/);
        await expect(weekendCell).not.toHaveClass(/calendar-day-holiday/);
    });
});
