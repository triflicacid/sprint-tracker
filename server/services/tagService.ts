import { db } from "../db/connection.js";
import type { Tag, EntityType, TagType } from "../../shared/types.js";

interface TagRow {
    id: number;
    name: string;
    tag_type: TagType;
}

function rowToTag(row: TagRow) {
    return { id: row.id, name: row.name, tagType: row.tag_type } as Tag;
}

/**
 * finds or creates a tag.
 *
 * @param name - tag name.
 * @param tagType - tag type to persist for new tags.
 * @returns the existing or created tag.
 */
export function findOrCreateTag(name: string, tagType: TagType) {
    const existing = db
        .prepare("SELECT * FROM tags WHERE name = ?")
        .get(name) as TagRow | undefined;
    if (existing) {
        return rowToTag(existing);
    }
    const result = db
        .prepare("INSERT INTO tags (name, tag_type) VALUES (?, ?)")
        .run(name, tagType);
    return { id: Number(result.lastInsertRowid), name, tagType } as Tag;
}

/**
 * attaches a tag to an entity.
 *
 * @param entityType - target entity type.
 * @param entityId - target entity id.
 * @param tagId - tag to attach.
 */
export function attachTag(entityType: EntityType, entityId: number, tagId: number) {
    db.prepare(
        "INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)"
    ).run(entityType, entityId, tagId);
}

/**
 * attaches a repo tag to a story.
 *
 * @param storyId - story to tag.
 * @param repoName - repo name to attach.
 */
export function tagStoryWithRepo(storyId: number, repoName: string) {
    const tag: Tag = findOrCreateTag(repoName, "repo");
    attachTag("story", storyId, tag.id);
}

/**
 * gets tags for an entity.
 *
 * @param entityType - entity type to query.
 * @param entityId - entity id to query.
 * @returns tags attached to the entity.
 */
export function getTagsForEntity(entityType: EntityType, entityId: number) {
    const rows = db
        .prepare(
            `SELECT tags.* FROM tags
             JOIN entity_tags ON entity_tags.tag_id = tags.id
             WHERE entity_tags.entity_type = ? AND entity_tags.entity_id = ?
             ORDER BY tags.name`
        )
        .all(entityType, entityId) as TagRow[];
    return rows.map(rowToTag);
}

/**
 * gets all tags.
 *
 * @returns all tags ordered by name.
 */
export function getAllTags() {
    const rows = db.prepare("SELECT * FROM tags ORDER BY name").all() as TagRow[];
    return rows.map(rowToTag);
}

/**
 * removes a tag from an entity.
 *
 * @param entityType - entity type to update.
 * @param entityId - entity id to update.
 * @param tagId - tag to detach.
 */
export function removeTag(entityType: EntityType, entityId: number, tagId: number) {
    db.prepare(
        "DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ? AND tag_id = ?"
    ).run(entityType, entityId, tagId);
}
