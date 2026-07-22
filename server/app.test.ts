import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { createApp } from "./app.js";

function makeStubClientDir(markerText: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sprint-tracker-client-"));
    fs.writeFileSync(path.join(dir, "index.html"), markerText);
    return dir;
}

const ORIGINAL_CLIENT_DIST_PATH = process.env.CLIENT_DIST_PATH;
let tempDirs: string[] = [];

afterEach(() => {
    if (ORIGINAL_CLIENT_DIST_PATH === undefined) {
        delete process.env.CLIENT_DIST_PATH;
    } else {
        process.env.CLIENT_DIST_PATH = ORIGINAL_CLIENT_DIST_PATH;
    }
    vi.restoreAllMocks();
    for (const dir of tempDirs) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
});

describe("static client serving", () => {
    it("serves index.html from client_dist_path when it is set", async () => {
        const dir = makeStubClientDir("stub-from-CLIENT_DIST_PATH");
        tempDirs.push(dir);
        process.env.CLIENT_DIST_PATH = dir;

        const response = await request(createApp()).get("/");

        expect(response.status).toBe(200);
        expect(response.text).toBe("stub-from-CLIENT_DIST_PATH");
    });

    it("falls back to <cwd>/dist/client when client_dist_path is unset", async () => {
        delete process.env.CLIENT_DIST_PATH;
        const cwdStandIn = fs.mkdtempSync(path.join(os.tmpdir(), "sprint-tracker-cwd-"));
        tempDirs.push(cwdStandIn);
        const clientDir = path.join(cwdStandIn, "dist", "client");
        fs.mkdirSync(clientDir, { recursive: true });
        fs.writeFileSync(path.join(clientDir, "index.html"), "stub-from-cwd-fallback");
        vi.spyOn(process, "cwd").mockReturnValue(cwdStandIn);

        const response = await request(createApp()).get("/");

        expect(response.status).toBe(200);
        expect(response.text).toBe("stub-from-cwd-fallback");
    });
});
