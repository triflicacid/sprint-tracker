INSERT INTO sprints (name, start_date, end_date, comment) VALUES
    ('Nebula Checkout Sprint 1', '2026-03-02', '2026-03-16', NULL);

INSERT INTO sprints (name, start_date, end_date, comment) VALUES
    ('Nebula Checkout Sprint 2', '2026-03-16', '2026-03-30', '1-day holiday, public holiday');

INSERT INTO sprints (name, start_date, end_date, comment) VALUES
    ('Nebula Checkout Sprint 3', '2026-03-30', NULL, NULL);

-- a couple of holiday-block days early in sprint 1, plus the public
-- holiday mentioned in sprint 2's comment above.
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-06');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-09');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-23');

-- sprint 1, story 1: two subtasks, both merged and released.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1001', 'NEB-1001',
     'Support saved payment methods at checkout');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'add saved card list endpoint', 'feature/neb-1001-saved-cards-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/214', 'payments-service', 'v4.12.0');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'render saved card selector in checkout ui', 'feature/neb-1001-checkout-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/588', 'checkout-web', 'v4.12.0');

-- sprint 1, story 2: jira only, nothing started.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1004', 'NEB-1004',
     'Investigate intermittent double-charge reports');

-- sprint 2, story 1: mixed progress, one subtask jira only, one in review.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1032', 'NEB-1032',
     'Add regional tax calculation for EU checkout');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1032'),
     'integrate vat rate lookup service', 'feature/neb-1032-vat-lookup', 'IN_REVIEW',
     'https://github.com/nebula-labs/tax-engine/pull/77', 'tax-engine');

INSERT INTO subtasks (story_id, title, branch_name, status) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1032'),
     'surface tax breakdown in order summary', '(unknown)', 'NEW');

-- sprint 2, story 2: pull request has pr comments to address, blocked.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1040', 'NEB-1040',
     'Retry failed webhook deliveries automatically');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1040'),
     'add exponential backoff to webhook dispatcher', 'feature/neb-1040-webhook-retry', 'PR_COMMENTS',
     'https://github.com/nebula-labs/notifications-service/pull/301', 'notifications-service');

-- sprint 3 (still open, no end date): one story cut for release, one in uat.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1058', 'NEB-1058',
     'Allow partial refunds from the support console');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1058'),
     'add partial refund endpoint', 'feature/neb-1058-partial-refund-api', 'CUT_RELEASE',
     'https://github.com/nebula-labs/payments-service/pull/229', 'payments-service');

INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1061', 'NEB-1061',
     'Show refund status timeline to support agents');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1061'),
     'build refund timeline component', 'feature/neb-1061-refund-timeline', 'UAT',
     'https://github.com/nebula-labs/support-console/pull/142', 'support-console', 'v4.13.0');

-- status_history: every subtask's full transition path from NEW up to its
-- current status, dated within its sprint and following static/statusFlow.json.
INSERT INTO status_history (entity_type, entity_id, status, release_version, changed_at) VALUES
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'NEW', NULL, '2026-03-02 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'WIP', NULL, '2026-03-02 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'IN_REVIEW', NULL, '2026-03-04 16:40:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'PR_COMMENTS', NULL, '2026-03-05 11:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'CUT_RELEASE', NULL, '2026-03-06 14:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'TESTING', 'v4.12.0', '2026-03-09 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'UAT', NULL, '2026-03-11 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), 'DONE', NULL, '2026-03-12 17:20:00'),

    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'NEW', NULL, '2026-03-03 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'WIP', NULL, '2026-03-03 10:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'IN_REVIEW', NULL, '2026-03-05 15:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'PR_COMMENTS', NULL, '2026-03-06 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'CUT_RELEASE', NULL, '2026-03-06 14:35:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'TESTING', 'v4.12.0', '2026-03-09 10:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'UAT', NULL, '2026-03-11 09:50:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), 'DONE', NULL, '2026-03-12 17:25:00'),

    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), 'NEW', NULL, '2026-03-17 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), 'WIP', NULL, '2026-03-17 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), 'IN_PR', NULL, '2026-03-19 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), 'IN_REVIEW', NULL, '2026-03-20 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), 'IN_PR', NULL, '2026-03-21 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), 'IN_REVIEW', NULL, '2026-03-22 14:00:00'),

    ('subtask', (SELECT id FROM subtasks WHERE branch_name = '(unknown)' AND story_id = (SELECT id FROM stories WHERE jira_key = 'NEB-1032')), 'NEW', NULL, '2026-03-18 11:00:00'),

    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1040-webhook-retry'), 'NEW', NULL, '2026-03-16 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1040-webhook-retry'), 'WIP', NULL, '2026-03-16 09:40:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1040-webhook-retry'), 'IN_PR', NULL, '2026-03-19 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1040-webhook-retry'), 'IN_REVIEW', NULL, '2026-03-20 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1040-webhook-retry'), 'PR_COMMENTS', NULL, '2026-03-24 16:00:00'),

    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1058-partial-refund-api'), 'NEW', NULL, '2026-03-30 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1058-partial-refund-api'), 'WIP', NULL, '2026-03-30 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1058-partial-refund-api'), 'IN_REVIEW', NULL, '2026-04-01 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1058-partial-refund-api'), 'PR_COMMENTS', NULL, '2026-04-02 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1058-partial-refund-api'), 'CUT_RELEASE', NULL, '2026-04-03 11:30:00'),

    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'NEW', NULL, '2026-03-31 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'WIP', NULL, '2026-03-31 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'IN_REVIEW', NULL, '2026-04-02 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'PR_COMMENTS', NULL, '2026-04-03 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'CUT_RELEASE', NULL, '2026-04-04 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'TESTING', 'v4.13.0', '2026-04-07 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), 'UAT', NULL, '2026-04-09 09:00:00');

-- tags: a mix of custom and repo tags, attached across several stories and subtasks.
INSERT INTO tags (name, tag_type) VALUES
    ('payments', 'custom'),
    ('checkout', 'custom'),
    ('bug', 'custom'),
    ('tax', 'custom'),
    ('reliability', 'custom'),
    ('refunds', 'custom'),
    ('backend', 'custom'),
    ('frontend', 'custom'),
    ('support-tooling', 'custom'),
    ('payments-service', 'repo'),
    ('checkout-web', 'repo'),
    ('tax-engine', 'repo'),
    ('notifications-service', 'repo'),
    ('support-console', 'repo');

INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES
    -- NEB-1001: story tagged with feature areas and both repos it touched
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1001'), (SELECT id FROM tags WHERE name = 'payments')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1001'), (SELECT id FROM tags WHERE name = 'checkout')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1001'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1001'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-saved-cards-api'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1001-checkout-ui'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1004: bug investigation, no subtasks yet
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1004'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1004'), (SELECT id FROM tags WHERE name = 'payments')),

    -- NEB-1032: tax work split across a backend lookup and a frontend surfacing task
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1032'), (SELECT id FROM tags WHERE name = 'tax')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1032'), (SELECT id FROM tags WHERE name = 'tax-engine')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1032-vat-lookup'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = '(unknown)' AND story_id = (SELECT id FROM stories WHERE jira_key = 'NEB-1032')), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1040: reliability work on the notification service
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1040'), (SELECT id FROM tags WHERE name = 'reliability')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1040'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1040-webhook-retry'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1058 / NEB-1061: refund support-console work, one backend one frontend
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1058'), (SELECT id FROM tags WHERE name = 'refunds')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1058'), (SELECT id FROM tags WHERE name = 'support-tooling')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1058-partial-refund-api'), (SELECT id FROM tags WHERE name = 'backend')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1061'), (SELECT id FROM tags WHERE name = 'refunds')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1061'), (SELECT id FROM tags WHERE name = 'support-console')),
    ('subtask', (SELECT id FROM subtasks WHERE branch_name = 'feature/neb-1061-refund-timeline'), (SELECT id FROM tags WHERE name = 'frontend'));
