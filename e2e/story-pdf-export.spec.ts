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

test("exporting a story downloads one pdf page for the summary plus one per subtask", async ({ page, request }) => {
    const suffix = Date.now();
    const sprint = await seedSprint(request, { name: `E2E Story Pdf ${suffix}`, startDate: "2031-10-01" });
    const story = await seedStory(request, sprint.id, {
        jiraUrl: "https://example.atlassian.net/browse/PDF-2",
        description: `e2e story pdf export ${suffix}`,
    });
    const subtaskA = await seedSubtask(request, story.id, `e2e subtask a ${suffix}`);
    await transitionSubtask(request, subtaskA.id, { status: "WIP", branchName: "feature/e2e-a" });
    await transitionSubtask(request, subtaskA.id, {
        status: "IN_PR",
        prUrl: "https://github.com/example/repo/pull/101",
    });
    await seedSubtask(request, story.id, `e2e subtask b ${suffix}`);

    await page.goto(`/#/stories/${story.id}`);
    await expect(page.getByText(`e2e story pdf export ${suffix}`)).toBeVisible();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "export pdf" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(new RegExp(`^story-${story.id}-export-\\d{4}-\\d{2}-\\d{2}\\.pdf$`));
    // one page for the story summary + one per subtask (2 subtasks seeded),
    // no flow-diagram page per subtask.
    const savedPath = await download.path();
    expect(pdfPageCount(savedPath)).toBe(3);

    const raw = fs.readFileSync(savedPath).toString("latin1");
    expect(raw).toContain("Jira: PDF-2");
    expect(raw).toContain("example.atlassian.net/browse/PDF-2"); // the jira link's actual /URI target
    expect(raw).toContain("Pull request: https://github.com/example/repo/pull/101");
    expect(raw).toContain("github.com/example/repo/pull/101"); // the pr link's actual /URI target
});
