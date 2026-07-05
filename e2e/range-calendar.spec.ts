import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

test("calendar page renders sprints as range-lines, splitting a shared handoff day in half", async ({
    page,
    request,
}) => {
    const suffix = Date.now();
    const sprintA = await seedSprint(request, {
        name: `E2E Range A ${suffix}`,
        startDate: "2026-05-01",
        endDate: "2026-05-15",
    });
    const sprintB = await seedSprint(request, {
        name: `E2E Range B ${suffix}`,
        startDate: "2026-05-15",
        endDate: "2026-05-29",
    });

    await page.goto("/#/calendar");

    const barA = page.locator(".range-bar", { hasText: `E2E Range A ${suffix}` }).first();
    const barB = page.locator(".range-bar", { hasText: `E2E Range B ${suffix}` }).first();
    await expect(barA).toBeVisible();
    await expect(barB).toBeVisible();

    // both sprints touch on 05-15 - they should still share a single lane
    // row (not stack), each bar's grid-column meeting at the same boundary.
    const week = page.locator(".range-week", { has: page.locator("text=15") }).first();
    await expect(week.locator(".range-lane")).toHaveCount(1);

    await barA.click();
    await expect(page).toHaveURL(new RegExp(`#/sprints/${sprintA.id}$`));
});

// Repo filter is auto-derived from a subtask's pr url (custom tags are
// hand-added - see story-tags.spec.ts). Fixed, non-overlapping range keeps
// this sprint out of other specs' lanes, which would change the
// range-lane count the test above asserts.
test("calendar page's repo filter narrows sprints down to ones with a matching repo tag", async ({
    page,
    request,
}) => {
    const suffix = Date.now();
    const repoName = `e2e-filter-repo-${suffix}`;
    const otherRepoName = `e2e-other-repo-${suffix}`;

    const sprint = await seedSprint(request, {
        name: `E2E Filter ${suffix}`,
        startDate: "2026-11-02",
        endDate: "2026-11-13",
    });
    const story = await seedStory(request, sprint.id, { description: `e2e filter story ${suffix}` });
    const subtask = await seedSubtask(request, story.id, "e2e filter subtask");
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/e2e-filter" });
    await transitionSubtask(request, subtask.id, {
        status: "IN_PR",
        prUrl: `https://github.com/example/${repoName}/pull/1`,
    });

    // Second sprint tagged with a different repo, just so `otherRepoName`
    // is a real dropdown option - proves exclusion, not a missing option.
    const otherSprint = await seedSprint(request, {
        name: `E2E Filter Other ${suffix}`,
        startDate: "2026-11-16",
        endDate: "2026-11-27",
    });
    const otherStory = await seedStory(request, otherSprint.id, { description: `e2e other filter story ${suffix}` });
    const otherSubtask = await seedSubtask(request, otherStory.id, "e2e other filter subtask");
    await transitionSubtask(request, otherSubtask.id, { status: "WIP", branchName: "feature/e2e-other-filter" });
    await transitionSubtask(request, otherSubtask.id, {
        status: "IN_PR",
        prUrl: `https://github.com/example/${otherRepoName}/pull/1`,
    });

    await page.goto("/#/calendar");
    const bar = page.locator(".range-bar", { hasText: `E2E Filter ${suffix}` }).first();
    await expect(bar).toBeVisible();

    const repoFilter = page.locator("label.tag-filter", { hasText: "repo" }).locator("select");
    await repoFilter.selectOption(repoName);
    await expect(bar).toBeVisible();

    // this sprint's story was never tagged with the other repo, so it must
    // drop out of view once the filter switches to it.
    await repoFilter.selectOption(otherRepoName);
    await expect(bar).toHaveCount(0);

    await repoFilter.selectOption("");
    await expect(bar).toBeVisible();
});
