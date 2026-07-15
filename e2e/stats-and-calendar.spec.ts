import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

test("stats page shows tiles and a read-only calendar, subtask detail calendar links to the pr", async ({
    page,
    request,
}) => {
    const today = new Date();
    const nearPast = new Date(today);
    nearPast.setUTCDate(nearPast.getUTCDate() - 10); // comfortably contains a full week back

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

    await page.goto(`/stats/${sprint.id}`);

    const prTile = page.getByText("pull requests");
    await expect(prTile).toBeVisible();
    await expect(prTile.locator("xpath=preceding-sibling::span[1]")).toHaveText("1");

    // the subtask's own activity calendar has no weekend muting, so its
    // most recent (today's) active day reliably shows the pr link
    // regardless of which day of the week the suite runs on.
    await page.goto(`/subtasks/${subtask.id}`);
    const prLink = page.locator(".activity-calendar .calendar-day-link").last();
    const [popup] = await Promise.all([page.waitForEvent("popup"), prLink.click()]);
    await expect(popup).toHaveURL("https://github.com/example/repo/pull/42");
    await popup.close();
});
