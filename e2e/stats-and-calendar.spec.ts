import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

// Most recent monday on or before `date` - keeps the holiday-toggle
// assertion on a weekday regardless of which day the suite runs on
// (weekends are muted and can't be toggled).
function mostRecentMonday(date: Date): Date {
    const result = new Date(date);
    const day = result.getUTCDay(); // 0 = sunday
    const diff = day === 0 ? 6 : day - 1;
    result.setUTCDate(result.getUTCDate() - diff);
    return result;
}

test("stats page shows tiles and a togglable weekday, subtask detail calendar links to the pr", async ({
    page,
    request,
}) => {
    const today = new Date();
    const nearPast = new Date(today);
    nearPast.setUTCDate(nearPast.getUTCDate() - 10); // comfortably contains a full week back
    const monday = mostRecentMonday(today);

    const sprint = await seedSprint(request, {
        name: `E2E Stats ${Date.now()}`,
        startDate: nearPast.toISOString().slice(0, 10),
    });
    const story = await seedStory(request, sprint.id, { description: "e2e stats story" });
    const subtask = await seedSubtask(request, story.id, "e2e stats subtask");
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/e2e" });
    await transitionSubtask(request, subtask.id, {
        status: "IN_PR",
        prUrl: "https://github.com/example/repo/pull/42",
    });

    await page.goto(`/#/stats?sprintId=${sprint.id}`);

    const prTile = page.getByText("pull requests");
    await expect(prTile).toBeVisible();
    await expect(prTile.locator("xpath=preceding-sibling::span[1]")).toHaveText("1");

    // Scope to monday's own month block first - a day number like 29 can
    // exist validly in both month blocks the ~10 day range can span.
    const mondayMonthLabel = monday.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    const mondayMonthBlock = page.locator(".calendar-month").filter({ hasText: mondayMonthLabel });
    // Not scoped to .calendar-day-active - the click below toggles that
    // class to holiday, and the locator must still match afterward.
    const mondayCell = mondayMonthBlock.locator(".calendar-day").filter({
        has: page.locator(".calendar-day-number", { hasText: new RegExp(`^${monday.getUTCDate()}$`) }),
    });
    await expect(mondayCell).toHaveClass(/calendar-day-active/);
    await mondayCell.click();
    await expect(mondayCell).toHaveClass(/calendar-day-holiday/);

    // the subtask's own activity calendar has no weekend muting, so its
    // most recent (today's) active day reliably shows the pr link
    // regardless of which day of the week the suite runs on.
    await page.goto(`/#/subtasks/${subtask.id}`);
    const prLink = page.locator(".activity-calendar .calendar-day-link").last();
    const [popup] = await Promise.all([page.waitForEvent("popup"), prLink.click()]);
    await expect(popup).toHaveURL("https://github.com/example/repo/pull/42");
    await popup.close();
});
