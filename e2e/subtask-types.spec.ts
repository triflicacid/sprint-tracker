import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask } from "./seed.js";
import { E2E_API_PORT } from "./testDbPath.js";

const API_BASE = `http://localhost:${E2E_API_PORT}/api`;

test("subtask types endpoint returns all expected type entries", async ({ request }) => {
    const response = await request.get(`${API_BASE}/subtask-types`);
    expect(response.ok()).toBe(true);
    const types = await response.json();
    const shortNames = types.map((t: { shortName: string }) => t.shortName);
    expect(shortNames).toContain("unknown");
    expect(shortNames).toContain("feature");
    expect(shortNames).toContain("bugfix");
    expect(shortNames).toContain("tech-debt");
    expect(shortNames).toContain("spike");
    expect(shortNames).toContain("chore");
    expect(shortNames).toContain("docs");
    expect(shortNames).toContain("test");
    expect(shortNames).toContain("security");
    expect(shortNames).toContain("perf");
});

test("creating a subtask with an explicit type persists it and shows its icon", async ({ page, request }) => {
    const sprint = await seedSprint(request, { name: `E2E Type Test ${Date.now()}` });
    const story = await seedStory(request, sprint.id, { description: "e2e subtask type story" });

    // seed a feature subtask via the API
    const response = await request.post(`${API_BASE}/stories/${story.id}/subtasks`, {
        data: { title: "e2e type feature subtask", type: "feature" },
    });
    expect(response.ok()).toBe(true);
    const subtask = await response.json();
    expect(subtask.type).toBe("feature");

    // navigate to the story page and check the icon is present in the row
    await page.goto(`/stories/${story.id}`);
    await expect(page.getByText("e2e type feature subtask")).toBeVisible();

    // the feature icon SVG should be rendered inside the subtask row
    const subtaskRow = page.locator(".subtask-row").first();
    await expect(subtaskRow.locator(".subtask-type-icon")).toBeVisible();
});

test("creating a subtask without a type defaults to unknown", async ({ request }) => {
    const sprint = await seedSprint(request, { name: `E2E Default Type ${Date.now()}` });
    const story = await seedStory(request, sprint.id, { description: "e2e default type story" });
    const subtask = await seedSubtask(request, story.id, "subtask with default type");

    // fetch the subtask and verify the type
    const response = await request.get(`${API_BASE}/subtasks/${subtask.id}`);
    const body = await response.json();
    expect(body.type).toBe("unknown");
});

test("creating a subtask with an invalid type is rejected with 400", async ({ request }) => {
    const sprint = await seedSprint(request, { name: `E2E Bad Type ${Date.now()}` });
    const story = await seedStory(request, sprint.id, { description: "e2e bad type story" });

    const response = await request.post(`${API_BASE}/stories/${story.id}/subtasks`, {
        data: { title: "bad type subtask", type: "not-a-real-type" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/invalid subtask type/i);
});

test("type selector appears on the story page and allows creating a typed subtask", async ({ page, request }) => {
    const sprint = await seedSprint(request, { name: `E2E Type Selector ${Date.now()}` });
    const story = await seedStory(request, sprint.id, { description: "e2e type selector story" });

    await page.goto(`/stories/${story.id}`);
    await expect(page.getByText("e2e type selector story")).toBeVisible();

    // the type select trigger should be visible next to the subtask title input
    const typeSelectTrigger = page.locator(".type-select-trigger");
    await expect(typeSelectTrigger).toBeVisible();

    // open the dropdown
    await typeSelectTrigger.click();
    const listbox = page.locator(".type-select-list");
    await expect(listbox).toBeVisible();

    // bugfix should appear as an option
    await expect(listbox.getByRole("option", { name: "Bugfix" })).toBeVisible();

    // select bugfix and add the subtask
    await listbox.getByRole("option", { name: "Bugfix" }).click();
    await expect(listbox).not.toBeVisible();

    // now the trigger should show "Bugfix"
    await expect(typeSelectTrigger).toHaveText(/Bugfix/);

    // fill in the title and submit
    await page.fill('input[placeholder="subtask title"]', "fix the login bug");
    await page.click("text=add subtask");

    // the new subtask should appear in the list
    await expect(page.getByText("fix the login bug")).toBeVisible();

    // find the subtask id from the row and check the API
    const subtaskIcon = page.locator(".subtask-row .subtask-type-icon").first();
    await expect(subtaskIcon).toBeVisible();
});

test("sprint stats include subtask type counts", async ({ request }) => {
    const sprint = await seedSprint(request, {
        name: `E2E Type Stats ${Date.now()}`,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
    });
    const story = await seedStory(request, sprint.id, { description: "e2e stats story" });

    // create subtasks with various types
    await request.post(`${API_BASE}/stories/${story.id}/subtasks`, {
        data: { title: "feature 1", type: "feature" },
    });
    await request.post(`${API_BASE}/stories/${story.id}/subtasks`, {
        data: { title: "feature 2", type: "feature" },
    });
    await request.post(`${API_BASE}/stories/${story.id}/subtasks`, {
        data: { title: "bugfix 1", type: "bugfix" },
    });

    const statsResponse = await request.get(`${API_BASE}/stats/sprint/${sprint.id}`);
    expect(statsResponse.ok()).toBe(true);
    const stats = await statsResponse.json();

    expect(Array.isArray(stats.subtaskTypeCounts)).toBe(true);
    const featureEntry = stats.subtaskTypeCounts.find((e: { type: string }) => e.type === "feature");
    const bugfixEntry = stats.subtaskTypeCounts.find((e: { type: string }) => e.type === "bugfix");
    expect(featureEntry?.count).toBe(2);
    expect(bugfixEntry?.count).toBe(1);
    // ordered by count desc, so feature comes first
    expect(stats.subtaskTypeCounts[0].type).toBe("feature");
});

