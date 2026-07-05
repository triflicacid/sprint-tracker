import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

describe("GET /api/status-flow", () => {
    it("serves the full flow document with states and transitions", async () => {
        const response = await request(app).get("/api/status-flow");
        expect(response.status).toBe(200);
        expect(response.body.states.map((state: { id: string }) => state.id)).toContain("DONE");
        expect(response.body.transitions.some((t: { from: string }) => t.from === "NEW")).toBe(true);
    });

    it("includes color and description on every state", async () => {
        const response = await request(app).get("/api/status-flow");
        for (const state of response.body.states) {
            expect(state.color).toMatch(/^#/);
            expect(state.description).toBeTruthy();
        }
    });
});
