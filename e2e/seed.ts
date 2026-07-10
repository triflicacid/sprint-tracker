import type { APIRequestContext } from "@playwright/test";
import { E2E_API_PORT } from "./testDbPath.js";

const API_BASE = `http://localhost:${E2E_API_PORT}/api`;

export async function seedSprint(
        request: APIRequestContext,
        overrides: { name?: string; startDate?: string; endDate?: string } = {}
): Promise<{ id: number }> {
    const response = await request.post(`${API_BASE}/sprints`, {
        data: {
            name: overrides.name ?? `E2E Sprint ${Date.now()}`,
            startDate: overrides.startDate ?? "2026-01-01",
            endDate: overrides.endDate,
        },
    });
    return response.json();
}

export async function seedStory(
        request: APIRequestContext,
        sprintId: number,
        overrides: { jiraUrl?: string; description?: string } = {}
): Promise<{ id: number }> {
    const response = await request.post(`${API_BASE}/sprints/${sprintId}/stories`, {
        data: {
            jiraUrl: overrides.jiraUrl ?? "https://example.atlassian.net/browse/E2E-1",
            description: overrides.description ?? "e2e story",
        },
    });
    return response.json();
}

export async function seedSubtask(
        request: APIRequestContext,
        storyId: number,
        title = "e2e subtask"
): Promise<{ id: number }> {
    const response = await request.post(`${API_BASE}/stories/${storyId}/subtasks`, {
        data: { title },
    });
    return response.json();
}

export async function transitionSubtask(
        request: APIRequestContext,
        subtaskId: number,
        body: Record<string, unknown>
): Promise<unknown> {
    const response = await request.patch(`${API_BASE}/subtasks/${subtaskId}`, { data: body });
    return response.json();
}
