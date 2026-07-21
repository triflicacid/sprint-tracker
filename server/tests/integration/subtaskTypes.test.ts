import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

describe("GET /api/subtask-types", () => {
    it("returns 200 with an array of subtask type entries", async () => {
        const response = await request(app).get("/api/subtask-types");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it("each entry has shortName, fullName, and description fields", async () => {
        const response = await request(app).get("/api/subtask-types");
        for (const entry of response.body) {
            expect(typeof entry.shortName).toBe("string");
            expect(typeof entry.fullName).toBe("string");
            expect(typeof entry.description).toBe("string");
        }
    });

    it("includes 'unknown' as a non-selectable entry", async () => {
        const response = await request(app).get("/api/subtask-types");
        const unknown = response.body.find((e: { shortName: string }) => e.shortName === "unknown");
        expect(unknown).toBeDefined();
        expect(unknown.selectable).toBe(false);
    });

    it("includes basic-tier types: feature, bugfix, tech-debt, spike", async () => {
        const response = await request(app).get("/api/subtask-types");
        const shortNames = response.body.map((e: { shortName: string }) => e.shortName);
        expect(shortNames).toContain("feature");
        expect(shortNames).toContain("bugfix");
        expect(shortNames).toContain("tech-debt");
        expect(shortNames).toContain("spike");
    });

    it("includes advanced-tier types: chore, docs, test, security, perf", async () => {
        const response = await request(app).get("/api/subtask-types");
        const shortNames = response.body.map((e: { shortName: string }) => e.shortName);
        expect(shortNames).toContain("chore");
        expect(shortNames).toContain("docs");
        expect(shortNames).toContain("test");
        expect(shortNames).toContain("security");
        expect(shortNames).toContain("perf");
    });

    it("returns the same list on repeated calls (no mutation)", async () => {
        const r1 = await request(app).get("/api/subtask-types");
        const r2 = await request(app).get("/api/subtask-types");
        expect(r1.body).toEqual(r2.body);
    });
});

