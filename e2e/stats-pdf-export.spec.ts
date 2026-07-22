import fs from "fs";
import {test, expect, APIRequestContext} from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

/**
 * extracts a page count from a downloaded pdf
 * @param path local path to the downloaded pdf
 * @returns parsed page count from the first /Count entry
 */
function pdfPageCount(path: string) {
    const raw = fs.readFileSync(path).toString("latin1");
    const match = raw.match(/\/Count (\d+)/);
    if (!match) {
        throw new Error("could not find a /Count entry in the pdf");
    }
    return Number(match[1]);
}

/**
 * seeds a sprint with one story and one subtask in pr for stats export checks
 * @param request playwright api request context
 * @param suffix unique suffix for generated names
 * @returns created sprint payload with id
 */
async function seedStatsSprint(request: APIRequestContext, suffix: number) {
    const sprint = await seedSprint(request, {
        name: `E2E Pdf Export ${suffix}`,
        startDate: "2031-09-01",
        endDate: "2031-09-14",
    });
    const story = await seedStory(request, sprint.id, {
        jiraUrl: "https://example.atlassian.net/browse/PDF-1",
        description: `e2e pdf export story ${suffix}`,
    });
    const subtask = await seedSubtask(request, story.id, `e2e pdf export subtask ${suffix}`);
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/e2e-pdf" });
    await transitionSubtask(request, subtask.id, {
        status: "IN_PR",
        prUrl: "https://github.com/example/repo/pull/99",
    });
    return sprint;
}

test("exporting a single stats section downloads a one-page pdf", async ({ page, request }) => {
    const suffix = Date.now();
    const sprint = await seedStatsSprint(request, suffix);

    await page.goto(`/stats/${sprint.id}`);
    await expect(page.getByText("pull requests")).toBeVisible();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "export pdf" }).first().click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^sprint-stats-summary-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(pdfPageCount(await download.path())).toBe(1);
});

test("exporting all stats sections downloads one multi-page pdf", async ({ page, request }) => {
    const suffix = Date.now();
    const sprint = await seedStatsSprint(request, suffix);

    await page.goto(`/stats/${sprint.id}`);
    await expect(page.getByText("pull requests")).toBeVisible();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "export all as pdf" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^sprint-stats-\d{4}-\d{2}-\d{2}\.pdf$/);
    // one page each for: summary, bugs vs stories, subtask categories, repo distribution,
    // time per story, complexity, burndown, status breakdown, calendar
    expect(pdfPageCount(await download.path())).toBe(9);
});
