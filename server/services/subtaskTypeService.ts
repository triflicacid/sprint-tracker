import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SubtaskTypeEntry } from "../../shared/types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const types = JSON.parse(
    fs.readFileSync(path.join(currentDir, "..", "..", "static", "subtask_types.json"), "utf-8")
) as SubtaskTypeEntry[];

const validShortNames = new Set(types.map((t) => t.shortName));

/**
 * returns configured subtask types.
 *
 * @returns subtask type entries from the static config.
 */
export function getSubtaskTypes(): SubtaskTypeEntry[] {
    return types;
}

/**
 * returns whether a subtask type is valid.
 *
 * @param type - subtask type short name.
 * @returns `true` when the type is allowed.
 */
export function isValidSubtaskType(type: string): boolean {
    return type === "unknown" || validShortNames.has(type);
}

