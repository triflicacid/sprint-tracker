-- sprint tracker schema

CREATE TABLE IF NOT EXISTS sprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    comment TEXT,
    project TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sprint_id INTEGER NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    jira_url TEXT NOT NULL,
    jira_key TEXT,
    description TEXT NOT NULL,
    jira_title TEXT,
    jira_labels TEXT,
    awaiting_more_subtasks INTEGER NOT NULL DEFAULT 0,
    story_points INTEGER,
    is_bug INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- a subtask is implemented by a single branch/pull request. `title` is set
-- on creation; `comment` is an optional freeform note, editable afterwards.
CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    comment TEXT,
    branch_name TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    url TEXT,
    repo_name TEXT,
    complexity_rating INTEGER,
    release_version TEXT,
    type TEXT NOT NULL DEFAULT 'unknown',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- every status transition on a subtask is recorded here, including the
-- release version if one was supplied on leaving cut_release.
CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    release_version TEXT,
    changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- individual dates marked as a holiday
CREATE TABLE IF NOT EXISTS holidays (
    date TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    tag_type TEXT NOT NULL DEFAULT 'custom'
);

-- tag association
CREATE TABLE IF NOT EXISTS entity_tags (
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entity_type, entity_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_story_id ON subtasks(story_id);
CREATE INDEX IF NOT EXISTS idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
