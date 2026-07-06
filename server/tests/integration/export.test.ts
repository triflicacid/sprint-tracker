import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import type { MarkdownExportFields } from "../../../shared/types.js";

const app = createApp();

const fields: MarkdownExportFields = {
    story: { jiraKey: true, title: true, status: true, tags: true, awaitingMoreSubtasks: true },
    subtask: {
        title: true,
        comment: true,
        branchName: true,
        prUrl: true,
        status: true,
        repoName: true,
        complexityRating: true,
        releaseVersion: true,
        createdAt: true,
    },
};

async function seedSprintWithSubtask() {
    const sprint = await request(app).post("/api/sprints").send({ name: "Export Sprint", startDate: "2026-01-01" });
    const story = await request(app)
        .post(`/api/sprints/${sprint.body.id}/stories`)
        .send({ jiraUrl: "https://x/browse/EXP-1", description: "export story" });
    const subtask = await request(app)
        .post(`/api/stories/${story.body.id}/subtasks`)
        .send({ title: "export subtask" });
    return { sprintId: sprint.body.id, storyId: story.body.id, subtaskId: subtask.body.id };
}

describe("POST /api/export/markdown", () => {
    it("returns a markdown file with the sprint, story and subtask", async () => {
        const { sprintId } = await seedSprintWithSubtask();

        const response = await request(app)
            .post("/api/export/markdown")
            .send({ sprintIds: [sprintId], fields });

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/text\/markdown/);
        expect(response.headers["content-disposition"]).toMatch(/attachment; filename="sprint-export-\d{4}-\d{2}-\d{2}\.md"/);
        expect(response.text).toContain("Export Sprint");
        expect(response.text).toContain("export story");
        expect(response.text).toContain("export subtask");
    });

    it("rejects a missing sprintIds with 400", async () => {
        const response = await request(app).post("/api/export/markdown").send({ fields });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/sprintIds is required/i);
    });

    it("rejects an empty sprintIds array with 400", async () => {
        const response = await request(app).post("/api/export/markdown").send({ sprintIds: [], fields });
        expect(response.status).toBe(400);
    });

    it("rejects a missing fields object with 400", async () => {
        const { sprintId } = await seedSprintWithSubtask();
        const response = await request(app).post("/api/export/markdown").send({ sprintIds: [sprintId] });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/fields is required/i);
    });

    it("combines multiple sprints into one document", async () => {
        const first = await seedSprintWithSubtask();
        const secondSprint = await request(app).post("/api/sprints").send({ name: "Second Sprint", startDate: "2026-02-01" });

        const response = await request(app)
            .post("/api/export/markdown")
            .send({ sprintIds: [first.sprintId, secondSprint.body.id], fields });

        expect(response.status).toBe(200);
        expect(response.text).toContain("Export Sprint");
        expect(response.text).toContain("Second Sprint");
    });
});
