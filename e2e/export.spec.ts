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
    await transitionSubtask(request, subtask.id, { comment: "this comment should be excluded" });

    await page.goto("/#/export");
    await expect(page.getByText(sprintName)).toBeVisible();
    await expect(page.getByText(otherSprintName)).toBeVisible();

    // date range covering only the first sprint
    const dateInputs = page.locator(".export-date-range input[type='date']");
    await dateInputs.nth(0).fill("2031-05-01");
    await dateInputs.nth(1).fill("2031-05-14");
    await page.getByRole("button", { name: "select sprints in range", exact: true }).click();

    const sprintCheckbox = page.locator(".export-sprint-item", { hasText: sprintName }).locator("input");
    const otherCheckbox = page.locator(".export-sprint-item", { hasText: otherSprintName }).locator("input");
    await expect(sprintCheckbox).toBeChecked();
    await expect(otherCheckbox).not.toBeChecked();

    // exclude comment and created date from the export
    await page.locator(".export-field-item", { hasText: "Comment" }).click();
    await page.locator(".export-field-item", { hasText: "Created date" }).click();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "generate export", exact: true }).click(),
    ]);
    const content = fs.readFileSync(await download.path(), "utf-8");

    expect(download.suggestedFilename()).toMatch(/^sprint-export-\d{4}-\d{2}-\d{2}\.md$/);
    expect(content).toContain(sprintName);
    expect(content).toContain(`e2e subtask ${suffix}`);
    expect(content).not.toContain(otherSprintName);
    expect(content).not.toContain("this comment should be excluded");
    expect(content).not.toContain("created:");

    // the field deselection persists across a reload
    await page.reload();
    await expect(page.locator(".export-field-item", { hasText: "Comment" }).locator("input")).not.toBeChecked();

    await page.getByRole("button", { name: "reset to defaults", exact: true }).click();
    await expect(page.locator(".export-field-item", { hasText: "Comment" }).locator("input")).toBeChecked();
    await expect(page.locator(".export-field-item", { hasText: "Created date" }).locator("input")).toBeChecked();

    // the per-sprint quick-export shortcut on SprintDetailPage downloads
    // immediately, using the fields just reset to defaults (so the comment
    // is included this time, with no picker shown at all).
    await page.goto(`/#/sprints/${sprint.id}`);
    await expect(page.getByText(`e2e story ${suffix}`)).toBeVisible();
    const [quickDownload] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "export", exact: true }).click(),
    ]);
    const quickContent = fs.readFileSync(await quickDownload.path(), "utf-8");
    expect(quickContent).toContain(sprintName);
    expect(quickContent).toContain(`e2e subtask ${suffix}`);
    expect(quickContent).toContain("this comment should be excluded");
});
