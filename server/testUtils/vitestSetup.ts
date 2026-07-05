import { beforeEach } from "vitest";
import { resetDatabase } from "./testDb.js";

// test database is in-memory
process.env.DB_PATH = ":memory:";

beforeEach(() => {
    resetDatabase();
});
