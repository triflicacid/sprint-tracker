import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import path from "path";

const ORIGINAL_DATA_DIR = process.env.DATA_DIR;

afterEach(() => {
    if (ORIGINAL_DATA_DIR === undefined) {
        delete process.env.DATA_DIR;
    } else {
        process.env.DATA_DIR = ORIGINAL_DATA_DIR;
    }
    vi.restoreAllMocks();
    vi.resetModules();
});

describe("initSchema", () => {
    it("reads schema.sql from DATA_DIR when it is set", async () => {
        process.env.DATA_DIR = path.join("fake", "data", "dir");
        vi.resetModules();
        const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValue("CREATE TABLE probe (id INTEGER);");

        const { initSchema } = await import("./connection.js");
        initSchema();

        expect(readSpy).toHaveBeenCalledWith(path.join("fake", "data", "dir", "schema.sql"), "utf-8");
    });

    it("falls back to <cwd>/data/schema.sql when DATA_DIR is unset", async () => {
        delete process.env.DATA_DIR;
        vi.resetModules();
        const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValue("CREATE TABLE probe (id INTEGER);");

        const { initSchema } = await import("./connection.js");
        initSchema();

        expect(readSpy).toHaveBeenCalledWith(path.join(process.cwd(), "data", "schema.sql"), "utf-8");
    });
});
