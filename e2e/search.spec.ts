import { test, expect, type APIRequestContext } from "@playwright/test";
import { E2E_API_PORT } from "./testDbPath.js";
import { seedSprint, seedStory, seedSubtask } from "./seed.js";

const API_BASE = `http://localhost:${E2E_API_PORT}/api`;

interface SearchFixture {
    sprintNebulaId: number;
    storyNebulaId: number;
    storyNebulaLabel: string;
    subtaskFeatureId: number;
    subtaskBugfixId: number;
    tagName: string;
    featureTitle: string;
    bugfixTitle: string;
}

async function seedSearchFixture(request: APIRequestContext, suffix: number): Promise<SearchFixture> {
    const sprintNebula = await seedSprint(request, {
        name: `Search Sprint Nebula ${suffix}`,
        startDate: "2026-06-01",
    });
    await request.patch(`${API_BASE}/sprints/${sprintNebula.id}`, {
        data: { project: "Nebula", comment: `auth search comment ${suffix}` },
    });

    const storyNebula = await seedStory(request, sprintNebula.id, {
        jiraUrl: `https://example.atlassian.net/browse/SRC-${suffix}`,
        description: `search auth story ${suffix}`,
    });

    const featureTitle = `auth feature ${suffix}`;
    const bugfixTitle = `auth bugfix ${suffix}`;
    const subtaskFeature = await request.post(`${API_BASE}/stories/${storyNebula.id}/subtasks`, {
        data: { title: featureTitle, type: "feature" },
    });
    const subtaskBugfix = await request.post(`${API_BASE}/stories/${storyNebula.id}/subtasks`, {
        data: { title: bugfixTitle, type: "bugfix" },
    });

    const tagName = `security-${suffix}`;
    await request.post(`${API_BASE}/stories/${storyNebula.id}/tags`, {
        data: { name: tagName },
    });

    const sprintAtlas = await seedSprint(request, {
        name: `Search Sprint Atlas ${suffix}`,
        startDate: "2026-07-01",
    });
    await request.patch(`${API_BASE}/sprints/${sprintAtlas.id}`, {
        data: { project: "Atlas", comment: `auth search comment ${suffix}` },
    });
    const storyAtlas = await seedStory(request, sprintAtlas.id, {
        jiraUrl: `https://example.atlassian.net/browse/ATL-${suffix}`,
        description: `search auth story ${suffix}`,
    });
    await seedSubtask(request, storyAtlas.id, `atlas unrelated ${suffix}`);

    return {
        sprintNebulaId: sprintNebula.id,
        storyNebulaId: storyNebula.id,
        storyNebulaLabel: `SRC-${suffix}: search auth story ${suffix}`,
        subtaskFeatureId: (await subtaskFeature.json()).id as number,
        subtaskBugfixId: (await subtaskBugfix.json()).id as number,
        tagName,
        featureTitle,
        bugfixTitle,
    };
}

test("search link from home opens /search", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "search", exact: true }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
});

test("text search returns grouped results and subtask card navigates", async ({ page, request }) => {
    const suffix = Date.now();
    const fixture = await seedSearchFixture(request, suffix);

    await page.goto("/search");
    await page.getByLabel("Query").fill("auth");

    await expect(page.getByRole("heading", { name: /Results \(/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Sprints \(/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Stories \(/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Subtasks \(/ })).toBeVisible();

    const bugfixCard = page.locator(".search-result-card", { hasText: fixture.bugfixTitle }).first();
    await expect(bugfixCard).toBeVisible();
    await bugfixCard.click();
    await expect(page).toHaveURL(new RegExp(`/subtasks/${fixture.subtaskBugfixId}$`));
});

test("tags-only search works and excludes sprint results", async ({ page, request }) => {
    const suffix = Date.now();
    const fixture = await seedSearchFixture(request, suffix);

    await page.goto("/search");
    await page.getByLabel("Internal tags").fill("security");
    await page.getByRole("button", { name: fixture.tagName }).click();

    await expect(page.getByRole("heading", { name: /^Stories \(/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Subtasks \(/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Sprints \(/ })).toHaveCount(0);
});

test("project, entity, story, and subtask-type filters combine correctly", async ({ page, request }) => {
    const suffix = Date.now();
    const fixture = await seedSearchFixture(request, suffix);

    await page.goto("/search");
    await page.getByLabel("Query").fill("auth");

    const projectInput = page.locator(".search-project-input input");
    await projectInput.fill("Neb");
    await page.getByRole("option", { name: "Nebula" }).click();
    await expect(page.getByText("Applied project: Nebula")).toBeVisible();

    await page.getByRole("checkbox", { name: "subtasks" }).check();
    await page.getByLabel("Within story").selectOption(String(fixture.storyNebulaId));
    await page.getByLabel("Subtask type").selectOption("bugfix");

    await expect(page.getByRole("heading", { name: /^Sprints \(/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /^Stories \(/ })).toHaveCount(0);
    await expect(page.locator(".search-result-card", { hasText: fixture.bugfixTitle })).toBeVisible();
    await expect(page.locator(".search-result-card", { hasText: fixture.featureTitle })).toHaveCount(0);

    await projectInput.fill("Nebula x");
    await expect(page.getByText("Applied project: Nebula")).toHaveCount(0);
});

test("no-results state appears for unmatched criteria", async ({ page, request }) => {
    const suffix = Date.now();
    await seedSearchFixture(request, suffix);

    await page.goto("/search");
    await page.getByLabel("Query").fill("no-match-query-value-xyz");

    await expect(page.getByText("No results for")).toBeVisible();
});




