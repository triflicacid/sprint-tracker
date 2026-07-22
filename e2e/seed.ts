import type { APIRequestContext } from "@playwright/test";
import { E2E_API_PORT } from "./testDbPath.js";

const API_BASE = `http://localhost:${E2E_API_PORT}/api`;

/**
 * creates a sprint through the e2e api
 * @param request playwright api request context
 * @param overrides optional sprint field overrides
 * @returns created sprint payload with id
 */
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

/**
 * creates a story in a sprint through the e2e api
 * @param request playwright api request context
 * @param sprintId target sprint id
 * @param overrides optional story field overrides
 * @returns created story payload with id
 */
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

/**
 * creates a subtask in a story through the e2e api
 * @param request playwright api request context
 * @param storyId target story id
 * @param title subtask title
 * @returns created subtask payload with id
 */
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

/**
 * applies a subtask transition payload through the e2e api
 * @param request playwright api request context
 * @param subtaskId target subtask id
 * @param body patch body sent to the transition endpoint
 * @returns parsed transition response payload
 */
export async function transitionSubtask(
        request: APIRequestContext,
        subtaskId: number,
        body: Record<string, unknown>
): Promise<unknown> {
    const response = await request.patch(`${API_BASE}/subtasks/${subtaskId}`, { data: body });
    return response.json();
}
