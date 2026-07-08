import fs from "fs";
import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

function pdfPageCount(path: string): number {
    const raw = fs.readFileSync(path).toString("latin1");
    const match = raw.match(/\/Count (\d+)/);
    if (!match) {
        throw new Error("could not find a /Count entry in the pdf");
    }
    return Number(match[1]);
}

test("exporting a single subtask downloads a one-page pdf for just that subtask", async ({ page, request }) => {
    const suffix = Date.now();
    const sprint = await seedSprint(request, { name: `E2E Subtask Pdf ${suffix}`, startDate: "2031-10-01" });
    const story = await seedStory(request, sprint.id, {
        jiraUrl: "https://example.atlassian.net/browse/PDF-3",
        description: `e2e subtask pdf export ${suffix}`,
    });
    const subtask = await seedSubtask(request, story.id, `e2e subtask ${suffix}`);
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/e2e-subtask" });
    await transitionSubtask(request, subtask.id, {
        status: "IN_PR",
        prUrl: "https://github.com/example/repo/pull/202",
    });

    await page.goto(`/subtasks/${subtask.id}`);
    await expect(page.getByRole("heading", { name: `e2e subtask ${suffix}` })).toBeVisible();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "export pdf" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^PDF-3-subtask-1-export-\d{4}-\d{2}-\d{2}\.pdf$/);
    const savedPath = await download.path();
    // one page only - no story summary page, no per-subtask flow diagram.
    expect(pdfPageCount(savedPath)).toBe(1);

    const raw = fs.readFileSync(savedPath).toString("latin1");
    expect(raw).toContain("Pull request: https://github.com/example/repo/pull/202");
    expect(raw).toContain("github.com/example/repo/pull/202"); // the pr link's actual /URI target
});
