import { db } from "../db/connection.js";
import type { EntityType, StatusHistoryEntry, SubtaskStatus } from "../../shared/types.js";

interface StatusHistoryRow {
    id: number;
    entity_type: EntityType;
    entity_id: number;
    status: SubtaskStatus;
    release_version: string | null;
    changed_at: string;
}

function rowToEntry(row: StatusHistoryRow): StatusHistoryEntry {
    return {
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        status: row.status,
        releaseVersion: row.release_version,
        changedAt: row.changed_at,
    };
}

export function recordStatusChange(
    entityType: EntityType,
    entityId: number,
    status: SubtaskStatus,
    releaseVersion: string | null
) {
    db.prepare(
        "INSERT INTO status_history (entity_type, entity_id, status, release_version) VALUES (?, ?, ?, ?)"
    ).run(entityType, entityId, status, releaseVersion);
}

export function getHistoryForEntity(entityType: EntityType, entityId: number) {
    const rows: StatusHistoryRow[] = db
        .prepare(
            "SELECT * FROM status_history WHERE entity_type = ? AND entity_id = ? ORDER BY changed_at"
        )
        .all(entityType, entityId) as StatusHistoryRow[];
    return rows.map(rowToEntry);
}

export function getAllHistoryForSprint(sprintId: number) {
    const rows = db
        .prepare(
            `SELECT status_history.* FROM status_history
             JOIN subtasks ON subtasks.id = status_history.entity_id
                AND status_history.entity_type = 'subtask'
             JOIN stories ON stories.id = subtasks.story_id
             WHERE stories.sprint_id = ?
             ORDER BY status_history.changed_at ASC`
        )
        .all(sprintId) as StatusHistoryRow[];
    return rows.map(rowToEntry);
}
