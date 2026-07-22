import { test, expect } from "@playwright/test";
import { seedSprint, seedStory } from "./seed.js";

// custom tags are scoped per-story, unlike auto-derived repo tags
// (range-calendar.spec.ts's filter test), which have no "x" button
test("adding and removing a custom tag on a story updates its tag list", async ({ page, request }) => {
    // bounded around "today" rather than the seed default's open-ended
    // 2026-01-01 start - an ongoing sprint stretches through "today" in the
    // range calendar, which (as real time passes) can start overlapping
    // fixed 2026 date ranges other e2e specs assert on in that same shared
    // db (see timesheet.spec.ts's "sprints mode" tests)
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const sprint = await seedSprint(request, {
        name: `E2E Tags ${Date.now()}`,
        startDate,
        endDate: endDate.toISOString().slice(0, 10),
    });
    const story = await seedStory(request, sprint.id, { description: "e2e tag story" });
    const tagName = `frontend-${Date.now()}`;

    await page.goto(`/stories/${story.id}`);
    await expect(page.getByText("e2e tag story")).toBeVisible();

    await page.fill('input[placeholder="add tag"]', tagName);
    await page.keyboard.press("Enter");

    const tagChip = page.locator(".tag", { hasText: tagName });
    await expect(tagChip).toBeVisible();
    await expect(tagChip).toHaveClass(/tag-custom/);

    // a second story on the same sprint shouldn't see a tag scoped to the
    // first - tags are per-story, not sprint-wide
    const otherStory = await seedStory(request, sprint.id, {
        description: "e2e untagged story",
        jiraUrl: "https://example.atlassian.net/browse/E2E-2",
    });
    await page.goto(`/stories/${otherStory.id}`);
    await expect(page.locator(".tag", { hasText: tagName })).toHaveCount(0);

    await page.goto(`/stories/${story.id}`);
    await expect(page.locator(".tag", { hasText: tagName })).toBeVisible();
    await page.locator(".tag", { hasText: tagName }).locator(".tag-remove").click();
    await expect(page.locator(".tag", { hasText: tagName })).toHaveCount(0);
});
