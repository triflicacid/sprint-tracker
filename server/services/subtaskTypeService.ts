import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SubtaskTypeEntry } from "../../shared/types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const types = JSON.parse(
    fs.readFileSync(path.join(currentDir, "..", "..", "static", "subtask-types.json"), "utf-8")
) as SubtaskTypeEntry[];

const validShortNames = new Set(types.map((t) => t.shortName));

export function getSubtaskTypes(): SubtaskTypeEntry[] {
    return types;
}

export function isValidSubtaskType(type: string): boolean {
    return type === "unknown" || validShortNames.has(type);
}

