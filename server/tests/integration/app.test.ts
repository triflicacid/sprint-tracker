import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../services/jiraService.js", () => ({
    fetchJiraInfo: vi.fn(),
}));

const { fetchJiraInfo } = await import("../../services/jiraService.js");
const { createApp } = await import("../../app.js");

const app = createApp();

beforeEach(() => {
    vi.mocked(fetchJiraInfo).mockReset();
});

describe("error-handling middleware", () => {
    it("responds 500 with a generic JSON body for an unexpected error", async () => {
        vi.mocked(fetchJiraInfo).mockRejectedValue(new Error("boom"));
        const response = await request(app).get("/api/jira/NEB-1");
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "internal server error" });
    });

    it("responds 409 with the error's own message for a sprint locked error", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const locked = await request(app)
            .patch(`/api/sprints/${sprint.body.id}`)
            .send({ endDate: "2020-01-01" });
        expect(locked.status).toBe(200);

        const response = await request(app).patch(`/api/sprints/${sprint.body.id}`).send({ comment: "nope" });
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: "cannot edit a sprint that has ended" });
    });
});
