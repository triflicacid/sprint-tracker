import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

describe("holidays", () => {
    it("adds, lists within range, and removes a holiday", async () => {
        const added = await request(app).post("/api/holidays").send({ date: "2026-03-06" });
        expect(added.status).toBe(201);
        expect(added.body).toEqual({ date: "2026-03-06" });

        const listed = await request(app).get("/api/holidays?start=2026-03-01&end=2026-03-31");
        expect(listed.body).toEqual(["2026-03-06"]);

        const removed = await request(app).delete("/api/holidays/2026-03-06");
        expect(removed.status).toBe(204);

        const listedAfter = await request(app).get("/api/holidays?start=2026-03-01&end=2026-03-31");
        expect(listedAfter.body).toEqual([]);
    });

    it("rejects a missing date with 400", async () => {
        const response = await request(app).post("/api/holidays").send({});
        expect(response.status).toBe(400);
    });

    it("defaults to an unbounded range when start/end are omitted", async () => {
        await request(app).post("/api/holidays").send({ date: "2026-03-06" });
        const response = await request(app).get("/api/holidays");
        expect(response.body).toEqual(["2026-03-06"]);
    });
});
