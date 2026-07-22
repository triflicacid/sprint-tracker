import fs from "fs";
import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

test("export page selects sprints by date range, the field picker changes the download, and it persists", async ({
    page,
    request,
}) => {
    const suffix = Date.now();
    const sprintName = `E2E Sprint ${suffix}`;
    const otherSprintName = `E2E Other Sprint ${suffix}`;

    const sprint = await seedSprint(request, { name: sprintName, startDate: "2031-05-01", endDate: "2031-05-14" });
    await seedSprint(request, { name: otherSprintName, startDate: "2031-08-01", endDate: "2031-08-14" });
    const story = await seedStory(request, sprint.id, {
        jiraUrl: "https://example.atlassian.net/browse/EXP-1",
        description: `e2e story ${suffix}`,
    });
    const subtask = await seedSubtask(request, story.id, `e2e subtask ${suffix}`);
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/e2e" });
    await transitionSubtask(request, subtask.id, { comment: "this is the subtask comment" });

    await page.goto("/export");
    await expect(page.getByText(sprintName)).toBeVisible();
    await expect(page.getByText(otherSprintName)).toBeVisible();

    // date range covering only the first sprint
    /**
     * sets one export page date input through the popover calendar
     * @param label date field label on the export page
     * @param isoDate target date in yyyy-mm-dd format
     */
    async function pickDate(label: "from" | "to", isoDate: string) {
        const [year, month, day] = isoDate.split("-").map(Number);
        await page.locator(".export-date-field", { hasText: label }).getByRole("button").click();
        await page.getByRole("combobox", { name: "month" }).selectOption({ index: month - 1 });
        await page.getByRole("spinbutton", { name: "year" }).fill(String(year));
        await page
            .locator(".calendar-day")
            .filter({ has: page.locator(".calendar-day-number", { hasText: new RegExp(`^${day}$`) }) })
            .click();
    }

    await pickDate("from", "2031-05-01");
    await pickDate("to", "2031-05-14");
    await page.getByRole("button", { name: "select sprints in range", exact: true }).click();

    const sprintCheckbox = page.locator(".export-sprint-item", { hasText: sprintName }).locator("input");
    const otherCheckbox = page.locator(".export-sprint-item", { hasText: otherSprintName }).locator("input");
    await expect(sprintCheckbox).toBeChecked();
    await expect(otherCheckbox).not.toBeChecked();

    // deselect branch name (default: included) and select comment
    // (default: excluded)
    await page.locator(".export-field-item", { hasText: "Branch name" }).click();
    await page.locator(".export-field-item", { hasText: "Comment" }).click();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "generate export", exact: true }).click(),
    ]);
    const content = fs.readFileSync(await download.path(), "utf-8");

    expect(download.suggestedFilename()).toMatch(/^sprint-export-\d{4}-\d{2}-\d{2}\.md$/);
    expect(content).toContain(sprintName);
    expect(content).toContain(`e2e subtask ${suffix}`);
    expect(content).not.toContain(otherSprintName);
    expect(content).toContain("this is the subtask comment");
    expect(content).not.toContain("branch:");

    // the field toggles persist across a reload
    await page.reload();
    await expect(page.locator(".export-field-item", { hasText: "Branch name" }).locator("input")).not.toBeChecked();
    await expect(page.locator(".export-field-item", { hasText: "Comment" }).locator("input")).toBeChecked();

    await page.getByRole("button", { name: "reset to defaults", exact: true }).click();
    await expect(page.locator(".export-field-item", { hasText: "Branch name" }).locator("input")).toBeChecked();
    await expect(page.locator(".export-field-item", { hasText: "Comment" }).locator("input")).not.toBeChecked();
});

test("the per-sprint quick-export button on SprintDetailPage uses the fields saved on the export page", async ({
    page,
    request,
}) => {
    const suffix = Date.now();
    const sprintName = `E2E Quick Export Sprint ${suffix}`;

    const sprint = await seedSprint(request, { name: sprintName, startDate: "2031-06-01", endDate: "2031-06-14" });
    const story = await seedStory(request, sprint.id, {
        jiraUrl: "https://example.atlassian.net/browse/EXP-2",
        description: `e2e story ${suffix}`,
    });
    const subtask = await seedSubtask(request, story.id, `e2e subtask ${suffix}`);
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/quick-export" });

    // customise the field selection via the export page first
    await page.goto("/export");
    await expect(page.getByText(sprintName)).toBeVisible();
    await page.locator(".export-field-item", { hasText: "Branch name" }).click();

    // ...then use the quick-export shortcut on the sprint page, which has
    // no picker of its own and should just pick up what was saved above
    await page.goto(`/sprints/${sprint.id}`);
    await expect(page.getByText(`e2e story ${suffix}`)).toBeVisible();
    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "export", exact: true }).click(),
    ]);
    const content = fs.readFileSync(await download.path(), "utf-8");

    expect(download.suggestedFilename()).toMatch(/^sprint-export-\d{4}-\d{2}-\d{2}\.md$/);
    expect(content).toContain(sprintName);
    expect(content).toContain(`e2e subtask ${suffix}`);
    expect(content).not.toContain("feature/quick-export");
});
