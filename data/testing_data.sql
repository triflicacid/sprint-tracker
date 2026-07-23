-- NOTE this test data is AI generated

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint 1', '2026-03-02', '2026-03-16', NULL, 'Nebula Checkout Platform');

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint 2', '2026-03-16', '2026-03-30', '1-day holiday, public holiday', 'Nebula Checkout Platform');

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint 4', '2026-05-05', NULL, NULL, 'Refund Management');

-- a couple of holiday-block days early in sprint 1, plus the public
-- holiday mentioned in sprint 2's comment above.
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-06');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-09');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-23');

-- ============================================================
-- SPRINT 1 (past, closed 2026-03-16) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-1001, 3 subtasks, all DONE (one with a two-round pr-comments
-- oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1001', 'NEB-1001',
     'Support saved payment methods at checkout', 8);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'add saved card list endpoint', 'feature/neb-1001-saved-cards-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/214', 'payments-service', 'v4.12.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'render saved card selector in checkout ui', 'feature/neb-1001-checkout-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/588', 'checkout-web', 'v4.12.0', 1, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'add card deletion endpoint', 'feature/neb-1001-delete-card', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/215', 'payments-service', 'v4.12.0', 3, 'feature');

-- story: NEB-1004, jira only, no subtasks yet - kept as a "just a jira
-- ticket, no code work started" example. Left unpointed (story_points NULL)
-- to exercise the "unpointed" case downstream. Already tagged 'bug' below,
-- so also flagged is_bug - a bug report can sit jira-only same as any story.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1004', 'NEB-1004',
     'Investigate intermittent double-charge reports', 1);

-- story: NEB-1010, 2 subtasks, both DONE (one with a single-round
-- in_pr <-> in_review oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1010', 'NEB-1010',
     'Add fraud-score check before charging', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1010'),
     'integrate fraud scoring api client', 'feature/neb-1010-fraud-client', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/216', 'payments-service', 'v4.12.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1010'),
     'block checkout above fraud threshold', 'feature/neb-1010-fraud-block', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/589', 'checkout-web', 'v4.12.0', 4, 'feature');

-- story: NEB-1012, bug, 1 subtask, DONE. Sprint 1 is mostly bugs (NEB-1004,
-- NEB-1012, NEB-1020 vs. just NEB-1001/NEB-1010 as regular stories).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1012', 'NEB-1012',
     'Fix duplicate order confirmation emails on webhook retry', 2, 1);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1012'),
     'dedupe email dispatch on webhook retry', 'bugfix/neb-1012-dedupe-email', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/304', 'notifications-service', 'v4.12.0', 1, 'bugfix');

-- story: NEB-1020, bug, 1 subtask, DONE (skips pr_comments).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1020', 'NEB-1020',
     'Fix checkout crash when a saved card has expired', 3, 1);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1020'),
     'guard against expired saved card in checkout flow', 'bugfix/neb-1020-expired-card-guard', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/592', 'checkout-web', 'v4.12.0', 2, 'bugfix');

-- ============================================================
-- SPRINT 2 (past, closed 2026-03-30) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-1032, 2 subtasks, both DONE (one continues the existing
-- in_pr <-> in_review oscillation through to release).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1032', 'NEB-1032',
     'Add regional tax calculation for EU checkout', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1032'),
     'integrate vat rate lookup service', 'feature/neb-1032-vat-lookup', 'DONE',
     'https://github.com/nebula-labs/tax-engine/pull/77', 'tax-engine', 'v4.13.0', 3, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1032'),
     'surface tax breakdown in order summary', 'feature/neb-1032-tax-breakdown-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/590', 'checkout-web', 'v4.13.0', 2, 'feature');

-- story: NEB-1040, 2 subtasks, both DONE (one continues the existing
-- pr-comments <-> in-review oscillation - two rounds of feedback total).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1040', 'NEB-1040',
     'Retry failed webhook deliveries automatically', 8);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1040'),
     'add exponential backoff to webhook dispatcher', 'feature/neb-1040-webhook-retry', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/301', 'notifications-service', 'v4.13.1', 4, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1040'),
     'add dead-letter queue for exhausted retries', 'feature/neb-1040-dlq', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/302', 'notifications-service', 'v4.13.0', 3, 'feature');

-- story: NEB-1045, 2 subtasks, both DONE.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1045', 'NEB-1045',
     'Send webhook delivery status to customer dashboard', 3);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1045'),
     'add delivery-status api endpoint', 'feature/neb-1045-status-api', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/303', 'notifications-service', 'v4.13.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1045'),
     'render delivery status widget', 'feature/neb-1045-status-widget', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/591', 'checkout-web', 'v4.13.0', 4, 'feature');

-- story: NEB-1042, bug, 1 subtask, DONE - sprint 2's one bug alongside its
-- three regular stories (not a majority here, unlike sprint 1).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1042', 'NEB-1042',
     'Fix webhook retries double-charging customers', 5, 1);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1042'),
     'add idempotency key to webhook retry dispatch', 'bugfix/neb-1042-webhook-idempotency', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/305', 'notifications-service', 'v4.13.1', 3, 'bugfix');

-- ============================================================
-- SPRINT 4 (current, open - no end_date) - a mix: some subtasks reach
-- DONE, most sit mid-flight at earlier stages.
-- ============================================================

-- story: NEB-1058, 1 subtask - pushed all the way to DONE this time, to
-- show a current-sprint item that's actually finished.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1058', 'NEB-1058',
     'Allow partial refunds from the support console', 2);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1058'),
     'add partial refund endpoint', 'feature/neb-1058-partial-refund-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/229', 'payments-service', 'v4.14.0', 3, 'feature');

-- story: NEB-1061, 1 subtask - deliberately left at UAT (not done yet),
-- showing work still in flight this sprint.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1061', 'NEB-1061',
     'Show refund status timeline to support agents', 3);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1061'),
     'build refund timeline component', 'feature/neb-1061-refund-timeline', 'UAT',
     'https://github.com/nebula-labs/support-console/pull/142', 'support-console', 'v4.13.0', 'feature');

-- story: NEB-1070, 3 subtasks spanning done / done / just started,
-- including a two-round in_review <-> pr_comments oscillation.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1070', 'NEB-1070',
     'Support multi-currency refunds', 13);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1070'),
     'add currency conversion helper', 'feature/neb-1070-fx-helper', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/230', 'payments-service', 'v4.14.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1070'),
     'wire multi-currency refund endpoint', 'feature/neb-1070-fx-endpoint', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/231', 'payments-service', 'v4.14.0', 5, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1070'),
     'add currency selector to refund form', 'feature/neb-1070-fx-selector', 'WIP', 'feature');

-- story: NEB-1075, 2 subtasks, both early/mid-flight (one not started at all).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1075', 'NEB-1075',
     'Add refund audit log', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1075'),
     'create audit log table and write path', 'feature/neb-1075-audit-log', 'IN_PR',
     'https://github.com/nebula-labs/payments-service/pull/232', 'payments-service', 2, 'tech-debt');

INSERT INTO subtasks (story_id, title, status, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1075'),
     'expose audit log to support ui', 'NEW', 'tech-debt');

-- story: NEB-1080, jira only, no subtasks yet - not every ticket in the
-- current sprint has code work started either. Left unpointed (story_points
-- NULL) to exercise the "unpointed" case downstream.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1080', 'NEB-1080',
     'Investigate refund latency spike');

-- story: NEB-1078, bug, 1 subtask - in review, following on from NEB-1070's
-- multi-currency work this same sprint.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1078', 'NEB-1078',
     'Fix incorrect currency rounding on multi-currency refunds', 3, 1);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1078'),
     'round converted refund amount to target currency precision', 'bugfix/neb-1078-fx-rounding', 'IN_REVIEW',
     'https://github.com/nebula-labs/payments-service/pull/233', 'payments-service', 2, 'bugfix');

-- story: NEB-1082, bug, 1 subtask - just started, no pr yet. Sprint 3 now
-- has two bugs (NEB-1078, NEB-1082) alongside its five regular stories.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 4'),
     'https://nebula.atlassian.net/browse/NEB-1082', 'NEB-1082',
     'Fix refund audit log missing entries for partial refunds', 2, 1);

INSERT INTO subtasks (story_id, title, branch_name, status, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1082'),
     'log partial refund amount in audit trail', 'bugfix/neb-1082-audit-log-partial', 'WIP', 'bugfix');

-- ============================================================
-- status_history: every subtask's full transition path from NEW up to its
-- current status, dated within its sprint and following
-- static/status_flow.json (some steps skipped where the flow allows it,
-- several oscillate back and forth before moving on).
-- ============================================================

INSERT INTO status_history (entity_type, entity_id, status, release_version, changed_at) VALUES
    -- NEB-1001 / add saved card list endpoint
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'NEW', NULL, '2026-03-02 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'WIP', NULL, '2026-03-02 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'IN_REVIEW', NULL, '2026-03-04 16:40:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'PR_COMMENTS', NULL, '2026-03-05 11:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'CUT_RELEASE', NULL, '2026-03-05 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'TESTING', 'v4.12.0', '2026-03-09 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'UAT', NULL, '2026-03-11 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), 'DONE', NULL, '2026-03-12 17:20:00'),

    -- NEB-1001 / render saved card selector in checkout ui
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'NEW', NULL, '2026-03-03 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'WIP', NULL, '2026-03-03 10:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'IN_REVIEW', NULL, '2026-03-05 15:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'PR_COMMENTS', NULL, '2026-03-06 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'CUT_RELEASE', NULL, '2026-03-06 14:35:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'TESTING', 'v4.12.0', '2026-03-09 10:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'UAT', NULL, '2026-03-11 09:50:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), 'DONE', NULL, '2026-03-12 17:25:00'),

    -- NEB-1001 / add card deletion endpoint - two rounds of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'NEW', NULL, '2026-03-02 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'WIP', NULL, '2026-03-02 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'IN_PR', NULL, '2026-03-03 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'IN_REVIEW', NULL, '2026-03-03 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'PR_COMMENTS', NULL, '2026-03-04 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'IN_REVIEW', NULL, '2026-03-04 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'PR_COMMENTS', NULL, '2026-03-05 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'IN_REVIEW', NULL, '2026-03-05 17:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'CUT_RELEASE', NULL, '2026-03-05 19:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'TESTING', 'v4.12.0', '2026-03-09 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'UAT', NULL, '2026-03-11 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), 'DONE', NULL, '2026-03-12 17:00:00'),

    -- NEB-1010 / integrate fraud scoring api client - skips pr_comments entirely
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'NEW', NULL, '2026-03-04 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'WIP', NULL, '2026-03-04 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'IN_PR', NULL, '2026-03-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'IN_REVIEW', NULL, '2026-03-06 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'CUT_RELEASE', NULL, '2026-03-06 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'TESTING', 'v4.12.0', '2026-03-09 10:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'UAT', NULL, '2026-03-11 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), 'DONE', NULL, '2026-03-12 18:00:00'),

    -- NEB-1010 / block checkout above fraud threshold - one round of in_pr <-> in_review
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'NEW', NULL, '2026-03-05 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'WIP', NULL, '2026-03-05 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'IN_PR', NULL, '2026-03-06 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'IN_REVIEW', NULL, '2026-03-07 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'IN_PR', NULL, '2026-03-07 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'IN_REVIEW', NULL, '2026-03-08 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'CUT_RELEASE', NULL, '2026-03-09 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'TESTING', 'v4.12.0', '2026-03-09 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'UAT', NULL, '2026-03-11 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), 'DONE', NULL, '2026-03-13 09:00:00'),

    -- NEB-1032 / integrate vat rate lookup service - two rounds of in_pr <-> in_review
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'NEW', NULL, '2026-03-17 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'WIP', NULL, '2026-03-17 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'IN_PR', NULL, '2026-03-19 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'IN_REVIEW', NULL, '2026-03-19 17:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'IN_PR', NULL, '2026-03-21 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'IN_REVIEW', NULL, '2026-03-21 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'CUT_RELEASE', NULL, '2026-03-23 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'TESTING', 'v4.13.0', '2026-03-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'UAT', NULL, '2026-03-27 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), 'DONE', NULL, '2026-03-28 17:00:00'),

    -- NEB-1032 / surface tax breakdown in order summary - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'NEW', NULL, '2026-03-18 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'WIP', NULL, '2026-03-18 11:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'IN_PR', NULL, '2026-03-20 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'IN_REVIEW', NULL, '2026-03-20 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'CUT_RELEASE', NULL, '2026-03-22 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'TESTING', 'v4.13.0', '2026-03-25 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'UAT', NULL, '2026-03-27 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), 'DONE', NULL, '2026-03-28 17:15:00'),

    -- NEB-1040 / add exponential backoff to webhook dispatcher - two rounds of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'NEW', NULL, '2026-03-16 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'WIP', NULL, '2026-03-16 09:40:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'IN_PR', NULL, '2026-03-19 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'IN_REVIEW', NULL, '2026-03-20 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'PR_COMMENTS', NULL, '2026-03-24 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'IN_REVIEW', NULL, '2026-03-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'PR_COMMENTS', NULL, '2026-03-25 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'IN_REVIEW', NULL, '2026-03-26 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'CUT_RELEASE', NULL, '2026-03-26 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'TESTING', 'v4.13.1', '2026-03-27 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'UAT', NULL, '2026-03-28 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), 'DONE', NULL, '2026-03-29 17:00:00'),

    -- NEB-1040 / add dead-letter queue for exhausted retries - skips in_pr (straight to in_review)
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'NEW', NULL, '2026-03-20 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'WIP', NULL, '2026-03-20 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'IN_REVIEW', NULL, '2026-03-21 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'CUT_RELEASE', NULL, '2026-03-21 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'TESTING', 'v4.13.0', '2026-03-25 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'UAT', NULL, '2026-03-27 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), 'DONE', NULL, '2026-03-28 17:30:00'),

    -- NEB-1045 / add delivery-status api endpoint - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'NEW', NULL, '2026-03-19 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'WIP', NULL, '2026-03-19 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'IN_PR', NULL, '2026-03-20 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'IN_REVIEW', NULL, '2026-03-20 17:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'CUT_RELEASE', NULL, '2026-03-22 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'TESTING', 'v4.13.0', '2026-03-25 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'UAT', NULL, '2026-03-27 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), 'DONE', NULL, '2026-03-28 18:00:00'),

    -- NEB-1045 / render delivery status widget - one round of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'NEW', NULL, '2026-03-20 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'WIP', NULL, '2026-03-20 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'IN_PR', NULL, '2026-03-21 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'IN_REVIEW', NULL, '2026-03-22 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'PR_COMMENTS', NULL, '2026-03-23 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'CUT_RELEASE', NULL, '2026-03-23 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'TESTING', 'v4.13.0', '2026-03-25 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'UAT', NULL, '2026-03-27 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), 'DONE', NULL, '2026-03-28 18:15:00'),

    -- NEB-1058 / add partial refund endpoint - now pushed through to done
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'NEW', NULL, '2026-05-05 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'WIP', NULL, '2026-05-05 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'IN_REVIEW', NULL, '2026-05-07 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'PR_COMMENTS', NULL, '2026-05-08 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'CUT_RELEASE', NULL, '2026-05-08 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'TESTING', 'v4.14.0', '2026-05-13 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'UAT', NULL, '2026-05-15 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'DONE', NULL, '2026-05-16 17:00:00'),

    -- NEB-1061 / build refund timeline component - still in flight, ends at uat
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'NEW', NULL, '2026-05-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'WIP', NULL, '2026-05-06 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'IN_REVIEW', NULL, '2026-05-08 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'PR_COMMENTS', NULL, '2026-05-09 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'CUT_RELEASE', NULL, '2026-05-09 15:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'TESTING', 'v4.13.0', '2026-05-13 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'UAT', NULL, '2026-05-15 09:00:00'),

    -- NEB-1070 / add currency conversion helper - done, no oscillation
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'NEW', NULL, '2026-05-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'WIP', NULL, '2026-05-06 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'IN_PR', NULL, '2026-05-07 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'IN_REVIEW', NULL, '2026-05-07 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'CUT_RELEASE', NULL, '2026-05-07 18:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'TESTING', 'v4.14.0', '2026-05-13 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'UAT', NULL, '2026-05-15 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'DONE', NULL, '2026-05-16 17:30:00'),

    -- NEB-1070 / wire multi-currency refund endpoint - two rounds of pr comments,
    -- pushed through to done.
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'NEW', NULL, '2026-05-07 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'WIP', NULL, '2026-05-07 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_PR', NULL, '2026-05-08 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_REVIEW', NULL, '2026-05-09 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'PR_COMMENTS', NULL, '2026-05-09 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_REVIEW', NULL, '2026-05-10 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'PR_COMMENTS', NULL, '2026-05-10 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_REVIEW', NULL, '2026-05-11 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'CUT_RELEASE', NULL, '2026-05-11 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'TESTING', 'v4.14.0', '2026-05-13 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'UAT', NULL, '2026-05-15 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'DONE', NULL, '2026-05-16 18:00:00'),

    -- NEB-1070 / add currency selector to refund form - just started
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency selector to refund form'), 'NEW', NULL, '2026-05-09 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency selector to refund form'), 'WIP', NULL, '2026-05-09 09:15:00'),

    -- NEB-1075 / create audit log table and write path - mid-flight, no review yet
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), 'NEW', NULL, '2026-05-10 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), 'WIP', NULL, '2026-05-10 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), 'IN_PR', NULL, '2026-05-12 11:00:00'),

    -- NEB-1075 / expose audit log to support ui - not started
    ('subtask', (SELECT id FROM subtasks WHERE title = 'expose audit log to support ui'), 'NEW', NULL, '2026-05-11 09:00:00'),

    -- NEB-1012 / dedupe email dispatch on webhook retry - bug fix, skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'NEW', NULL, '2026-03-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'WIP', NULL, '2026-03-06 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'IN_REVIEW', NULL, '2026-03-07 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'CUT_RELEASE', NULL, '2026-03-07 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'TESTING', 'v4.12.0', '2026-03-09 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'UAT', NULL, '2026-03-11 10:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), 'DONE', NULL, '2026-03-12 17:30:00'),

    -- NEB-1020 / guard against expired saved card in checkout flow - bug fix, one round of in_pr <-> in_review
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'NEW', NULL, '2026-03-09 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'WIP', NULL, '2026-03-09 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'IN_PR', NULL, '2026-03-10 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'IN_REVIEW', NULL, '2026-03-10 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'CUT_RELEASE', NULL, '2026-03-11 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'TESTING', 'v4.12.0', '2026-03-11 10:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'UAT', NULL, '2026-03-12 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), 'DONE', NULL, '2026-03-13 17:00:00'),

    -- NEB-1042 / add idempotency key to webhook retry dispatch - bug fix, skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'NEW', NULL, '2026-03-19 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'WIP', NULL, '2026-03-19 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'IN_PR', NULL, '2026-03-20 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'IN_REVIEW', NULL, '2026-03-20 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'CUT_RELEASE', NULL, '2026-03-22 10:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'TESTING', 'v4.13.1', '2026-03-25 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'UAT', NULL, '2026-03-27 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), 'DONE', NULL, '2026-03-28 18:30:00'),

    -- NEB-1078 / round converted refund amount to target currency precision - bug fix, still in review
    ('subtask', (SELECT id FROM subtasks WHERE title = 'round converted refund amount to target currency precision'), 'NEW', NULL, '2026-05-12 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'round converted refund amount to target currency precision'), 'WIP', NULL, '2026-05-12 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'round converted refund amount to target currency precision'), 'IN_PR', NULL, '2026-05-14 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'round converted refund amount to target currency precision'), 'IN_REVIEW', NULL, '2026-05-14 15:00:00'),

    -- NEB-1082 / log partial refund amount in audit trail - bug fix, just started
    ('subtask', (SELECT id FROM subtasks WHERE title = 'log partial refund amount in audit trail'), 'NEW', NULL, '2026-05-13 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'log partial refund amount in audit trail'), 'WIP', NULL, '2026-05-13 09:15:00');

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
    ('fraud', 'custom'),
    ('multi-currency', 'custom'),
    ('audit-log', 'custom'),
    ('latency', 'custom'),
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
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add saved card list endpoint'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render saved card selector in checkout ui'), (SELECT id FROM tags WHERE name = 'frontend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add card deletion endpoint'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1004: bug investigation, no subtasks yet
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1004'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1004'), (SELECT id FROM tags WHERE name = 'payments')),

    -- NEB-1010: fraud checks split across a backend client and a frontend block
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1010'), (SELECT id FROM tags WHERE name = 'fraud')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1010'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1010'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate fraud scoring api client'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'block checkout above fraud threshold'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1032: tax work split across a backend lookup and a frontend surfacing task
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1032'), (SELECT id FROM tags WHERE name = 'tax')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1032'), (SELECT id FROM tags WHERE name = 'tax-engine')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate vat rate lookup service'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface tax breakdown in order summary'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1040: reliability work on the notification service
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1040'), (SELECT id FROM tags WHERE name = 'reliability')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1040'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add exponential backoff to webhook dispatcher'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add dead-letter queue for exhausted retries'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1045: customer-facing delivery status, backend + frontend
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1045'), (SELECT id FROM tags WHERE name = 'reliability')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1045'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1045'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add delivery-status api endpoint'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'render delivery status widget'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1058 / NEB-1061: refund support-console work, one backend one frontend
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1058'), (SELECT id FROM tags WHERE name = 'refunds')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1058'), (SELECT id FROM tags WHERE name = 'support-tooling')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), (SELECT id FROM tags WHERE name = 'backend')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1061'), (SELECT id FROM tags WHERE name = 'refunds')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1061'), (SELECT id FROM tags WHERE name = 'support-console')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1070: multi-currency refunds, backend x2 + frontend
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1070'), (SELECT id FROM tags WHERE name = 'refunds')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1070'), (SELECT id FROM tags WHERE name = 'multi-currency')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1070'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency selector to refund form'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1075: audit log work, backend only so far
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1075'), (SELECT id FROM tags WHERE name = 'audit-log')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1075'), (SELECT id FROM tags WHERE name = 'refunds')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'expose audit log to support ui'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1080: latency investigation, no subtasks yet
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1080'), (SELECT id FROM tags WHERE name = 'latency')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1080'), (SELECT id FROM tags WHERE name = 'reliability')),

    -- NEB-1012: bug, duplicate confirmation emails
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1012'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1012'), (SELECT id FROM tags WHERE name = 'reliability')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1012'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'dedupe email dispatch on webhook retry'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1020: bug, expired saved card crash
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1020'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1020'), (SELECT id FROM tags WHERE name = 'payments')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1020'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'guard against expired saved card in checkout flow'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1042: bug, webhook retries double-charging
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1042'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1042'), (SELECT id FROM tags WHERE name = 'reliability')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1042'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add idempotency key to webhook retry dispatch'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1078: bug, multi-currency refund rounding
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1078'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1078'), (SELECT id FROM tags WHERE name = 'multi-currency')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1078'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'round converted refund amount to target currency precision'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1082: bug, refund audit log missing entries
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1082'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1082'), (SELECT id FROM tags WHERE name = 'audit-log')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1082'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'log partial refund amount in audit trail'), (SELECT id FROM tags WHERE name = 'backend'));

-- ============================================================
-- ADDITIONAL HISTORICAL SPRINTS (added later, for a larger velocity-testing
-- dataset) - three more 2-week sprints, all in the past, immediately
-- preceding "Nebula Checkout Sprint 1" above. Unlike sprints 1/3, every
-- story here is fully DONE (no jira-only or mid-flight items) - that's what
-- a closed sprint actually looks like once everything shipped.
-- ============================================================

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint -2', '2026-01-19', '2026-02-02', NULL, 'Nebula Checkout Platform');

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint -1', '2026-02-02', '2026-02-16', '1-day holiday mid-sprint', 'Nebula Checkout Platform');

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint 0', '2026-02-16', '2026-03-02', NULL, 'Nebula Checkout Platform');

INSERT OR IGNORE INTO holidays (date) VALUES ('2026-02-09');

-- ============================================================
-- SPRINT -2 (past, closed 2026-02-02) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-901, 3 subtasks, all DONE.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint -2'),
     'https://nebula.atlassian.net/browse/NEB-901', 'NEB-901',
     'Add guest checkout flow', 8);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-901'),
     'scaffold guest checkout page', 'feature/neb-901-guest-page', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/540', 'checkout-web', 'v4.9.0', 3, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-901'),
     'add guest order creation endpoint', 'feature/neb-901-guest-order-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/188', 'payments-service', 'v4.9.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-901'),
     'send guest checkout confirmation email', 'feature/neb-901-guest-email', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/260', 'notifications-service', 'v4.9.0', 1, 'feature');

-- story: NEB-905, 2 subtasks, both DONE.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint -2'),
     'https://nebula.atlassian.net/browse/NEB-905', 'NEB-905',
     'Add address autocomplete to checkout', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-905'),
     'integrate address lookup api client', 'feature/neb-905-address-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/189', 'payments-service', 'v4.9.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-905'),
     'wire autocomplete widget into checkout form', 'feature/neb-905-address-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/541', 'checkout-web', 'v4.9.0', 3, 'feature');

-- story: NEB-912, 2 subtasks, both DONE.
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint -2'),
     'https://nebula.atlassian.net/browse/NEB-912', 'NEB-912',
     'Support promo code stacking rules', 3);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-912'),
     'enforce promo stacking rules in pricing engine', 'feature/neb-912-promo-rules', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/190', 'payments-service', 'v4.9.1', 3, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-912'),
     'surface stacking error message in checkout ui', 'feature/neb-912-promo-error-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/542', 'checkout-web', 'v4.9.1', 1, 'feature');

-- ============================================================
-- SPRINT -1 (past, closed 2026-02-16) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-920, 2 subtasks, both DONE (one with a two-round pr-comments oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint -1'),
     'https://nebula.atlassian.net/browse/NEB-920', 'NEB-920',
     'Add Apple Pay support', 8);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-920'),
     'integrate apple pay merchant session api', 'feature/neb-920-apple-pay-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/191', 'payments-service', 'v4.10.0', 4, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-920'),
     'add apple pay button to checkout', 'feature/neb-920-apple-pay-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/543', 'checkout-web', 'v4.10.0', 2, 'feature');

-- story: NEB-925, 2 subtasks, both DONE (one with a one-round in_pr <-> in_review oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint -1'),
     'https://nebula.atlassian.net/browse/NEB-925', 'NEB-925',
     'Improve search relevance ranking', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-925'),
     'tune bm25 weighting for product search', 'feature/neb-925-search-ranking', 'DONE',
     'https://github.com/nebula-labs/search-service/pull/44', 'search-service', 'v4.10.0', 3, 'spike');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-925'),
     'add search relevance debug panel', 'feature/neb-925-search-debug-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/544', 'checkout-web', 'v4.10.0', 2, 'tech-debt');

-- story: NEB-931, 3 subtasks, all DONE (two with pr-comments oscillations).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint -1'),
     'https://nebula.atlassian.net/browse/NEB-931', 'NEB-931',
     'Add account merge for duplicate signups', 13);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-931'),
     'detect duplicate accounts by email+phone', 'feature/neb-931-dup-detection', 'DONE',
     'https://github.com/nebula-labs/user-service/pull/12', 'user-service', 'v4.10.1', 4, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-931'),
     'merge order history across accounts', 'feature/neb-931-merge-orders', 'DONE',
     'https://github.com/nebula-labs/user-service/pull/13', 'user-service', 'v4.10.1', 5, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-931'),
     'notify user after account merge', 'feature/neb-931-merge-notify', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/261', 'notifications-service', 'v4.10.1', 1, 'feature');

-- ============================================================
-- SPRINT 0 (past, closed 2026-03-02) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-940, 2 subtasks, both DONE (one with a one-round pr-comments oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 0'),
     'https://nebula.atlassian.net/browse/NEB-940', 'NEB-940',
     'Add subscription billing support', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-940'),
     'add recurring charge scheduler', 'feature/neb-940-recurring-charge', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/192', 'payments-service', 'v4.11.0', 3, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-940'),
     'show subscription management page', 'feature/neb-940-subscription-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/545', 'checkout-web', 'v4.11.0', 2, 'feature');

-- story: NEB-945, 2 subtasks, both DONE (skip pr_comments).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 0'),
     'https://nebula.atlassian.net/browse/NEB-945', 'NEB-945',
     'Add order export to CSV for support team', 3);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-945'),
     'add csv export endpoint', 'feature/neb-945-csv-export-api', 'DONE',
     'https://github.com/nebula-labs/support-console/pull/118', 'support-console', 'v4.11.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-945'),
     'add export button to support console', 'feature/neb-945-csv-export-ui', 'DONE',
     'https://github.com/nebula-labs/support-console/pull/119', 'support-console', 'v4.11.0', 1, 'feature');

-- story: NEB-951, 2 subtasks, both DONE (one with a two-round in_review <-> pr_comments oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 0'),
     'https://nebula.atlassian.net/browse/NEB-951', 'NEB-951',
     'Reduce checkout page load latency', 8);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-951'),
     'lazy-load non-critical checkout scripts', 'feature/neb-951-lazy-load', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/546', 'checkout-web', 'v4.11.1', 3, 'tech-debt');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-951'),
     'add cdn caching for static checkout assets', 'feature/neb-951-cdn-cache', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/547', 'checkout-web', 'v4.11.1', 2, 'tech-debt');

-- ============================================================
-- status_history for sprints -2/-1/0's subtasks - same full-transition-path
-- convention as above, dated within each sprint's own window.
-- ============================================================

INSERT INTO status_history (entity_type, entity_id, status, release_version, changed_at) VALUES
    -- NEB-901 / scaffold guest checkout page - skips in_pr and pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'NEW', NULL, '2026-01-19 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'WIP', NULL, '2026-01-19 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'IN_REVIEW', NULL, '2026-01-21 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'CUT_RELEASE', NULL, '2026-01-22 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'TESTING', 'v4.9.0', '2026-01-26 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'UAT', NULL, '2026-01-28 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), 'DONE', NULL, '2026-01-29 17:00:00'),

    -- NEB-901 / add guest order creation endpoint - one round of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'NEW', NULL, '2026-01-19 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'WIP', NULL, '2026-01-19 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'IN_REVIEW', NULL, '2026-01-21 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'PR_COMMENTS', NULL, '2026-01-22 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'IN_REVIEW', NULL, '2026-01-22 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'CUT_RELEASE', NULL, '2026-01-23 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'TESTING', 'v4.9.0', '2026-01-26 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'UAT', NULL, '2026-01-28 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), 'DONE', NULL, '2026-01-29 17:15:00'),

    -- NEB-901 / send guest checkout confirmation email - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'NEW', NULL, '2026-01-20 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'WIP', NULL, '2026-01-20 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'IN_PR', NULL, '2026-01-21 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'IN_REVIEW', NULL, '2026-01-21 15:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'CUT_RELEASE', NULL, '2026-01-22 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'TESTING', 'v4.9.0', '2026-01-26 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'UAT', NULL, '2026-01-28 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), 'DONE', NULL, '2026-01-29 17:30:00'),

    -- NEB-905 / integrate address lookup api client
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'NEW', NULL, '2026-01-22 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'WIP', NULL, '2026-01-22 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'IN_PR', NULL, '2026-01-23 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'IN_REVIEW', NULL, '2026-01-23 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'CUT_RELEASE', NULL, '2026-01-26 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'TESTING', 'v4.9.0', '2026-01-28 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'UAT', NULL, '2026-01-30 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), 'DONE', NULL, '2026-01-31 17:00:00'),

    -- NEB-905 / wire autocomplete widget into checkout form - one round of in_pr <-> in_review
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'NEW', NULL, '2026-01-22 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'WIP', NULL, '2026-01-22 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'IN_PR', NULL, '2026-01-23 12:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'IN_REVIEW', NULL, '2026-01-24 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'IN_PR', NULL, '2026-01-24 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'IN_REVIEW', NULL, '2026-01-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'CUT_RELEASE', NULL, '2026-01-26 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'TESTING', 'v4.9.0', '2026-01-28 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'UAT', NULL, '2026-01-30 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), 'DONE', NULL, '2026-01-31 17:15:00'),

    -- NEB-912 / enforce promo stacking rules in pricing engine
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'NEW', NULL, '2026-01-26 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'WIP', NULL, '2026-01-26 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'IN_REVIEW', NULL, '2026-01-27 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'CUT_RELEASE', NULL, '2026-01-28 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'TESTING', 'v4.9.1', '2026-01-29 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'UAT', NULL, '2026-01-30 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), 'DONE', NULL, '2026-01-31 17:30:00'),

    -- NEB-912 / surface stacking error message in checkout ui - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'NEW', NULL, '2026-01-26 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'WIP', NULL, '2026-01-26 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'IN_PR', NULL, '2026-01-27 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'IN_REVIEW', NULL, '2026-01-27 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'CUT_RELEASE', NULL, '2026-01-28 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'TESTING', 'v4.9.1', '2026-01-29 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'UAT', NULL, '2026-01-30 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), 'DONE', NULL, '2026-01-31 17:45:00'),

    -- NEB-920 / integrate apple pay merchant session api - two rounds of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'NEW', NULL, '2026-02-02 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'WIP', NULL, '2026-02-02 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'IN_REVIEW', NULL, '2026-02-04 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'PR_COMMENTS', NULL, '2026-02-05 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'IN_REVIEW', NULL, '2026-02-05 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'PR_COMMENTS', NULL, '2026-02-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'IN_REVIEW', NULL, '2026-02-06 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'CUT_RELEASE', NULL, '2026-02-09 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'TESTING', 'v4.10.0', '2026-02-11 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'UAT', NULL, '2026-02-12 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), 'DONE', NULL, '2026-02-13 17:00:00'),

    -- NEB-920 / add apple pay button to checkout
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'NEW', NULL, '2026-02-02 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'WIP', NULL, '2026-02-02 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'IN_PR', NULL, '2026-02-04 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'IN_REVIEW', NULL, '2026-02-04 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'CUT_RELEASE', NULL, '2026-02-05 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'TESTING', 'v4.10.0', '2026-02-11 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'UAT', NULL, '2026-02-12 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), 'DONE', NULL, '2026-02-13 17:15:00'),

    -- NEB-925 / tune bm25 weighting for product search - one round of in_pr <-> in_review
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'NEW', NULL, '2026-02-04 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'WIP', NULL, '2026-02-04 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'IN_PR', NULL, '2026-02-05 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'IN_REVIEW', NULL, '2026-02-05 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'IN_PR', NULL, '2026-02-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'IN_REVIEW', NULL, '2026-02-06 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'CUT_RELEASE', NULL, '2026-02-09 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'TESTING', 'v4.10.0', '2026-02-11 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'UAT', NULL, '2026-02-12 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), 'DONE', NULL, '2026-02-13 17:30:00'),

    -- NEB-925 / add search relevance debug panel
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'NEW', NULL, '2026-02-04 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'WIP', NULL, '2026-02-04 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'IN_REVIEW', NULL, '2026-02-05 15:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'CUT_RELEASE', NULL, '2026-02-06 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'TESTING', 'v4.10.0', '2026-02-11 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'UAT', NULL, '2026-02-12 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), 'DONE', NULL, '2026-02-13 17:45:00'),

    -- NEB-931 / detect duplicate accounts by email+phone
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'NEW', NULL, '2026-02-06 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'WIP', NULL, '2026-02-06 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'IN_PR', NULL, '2026-02-09 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'IN_REVIEW', NULL, '2026-02-09 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'CUT_RELEASE', NULL, '2026-02-10 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'TESTING', 'v4.10.1', '2026-02-12 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'UAT', NULL, '2026-02-13 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), 'DONE', NULL, '2026-02-14 17:00:00'),

    -- NEB-931 / merge order history across accounts - two rounds of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'NEW', NULL, '2026-02-06 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'WIP', NULL, '2026-02-06 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'IN_REVIEW', NULL, '2026-02-09 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'PR_COMMENTS', NULL, '2026-02-10 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'IN_REVIEW', NULL, '2026-02-10 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'PR_COMMENTS', NULL, '2026-02-11 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'IN_REVIEW', NULL, '2026-02-11 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'CUT_RELEASE', NULL, '2026-02-12 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'TESTING', 'v4.10.1', '2026-02-13 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'UAT', NULL, '2026-02-14 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), 'DONE', NULL, '2026-02-15 17:00:00'),

    -- NEB-931 / notify user after account merge - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'NEW', NULL, '2026-02-09 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'WIP', NULL, '2026-02-09 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'IN_PR', NULL, '2026-02-10 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'IN_REVIEW', NULL, '2026-02-10 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'CUT_RELEASE', NULL, '2026-02-11 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'TESTING', 'v4.10.1', '2026-02-13 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'UAT', NULL, '2026-02-14 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), 'DONE', NULL, '2026-02-15 17:30:00'),

    -- NEB-940 / add recurring charge scheduler
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'NEW', NULL, '2026-02-16 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'WIP', NULL, '2026-02-16 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'IN_PR', NULL, '2026-02-18 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'IN_REVIEW', NULL, '2026-02-18 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'CUT_RELEASE', NULL, '2026-02-19 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'TESTING', 'v4.11.0', '2026-02-23 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'UAT', NULL, '2026-02-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), 'DONE', NULL, '2026-02-26 17:00:00'),

    -- NEB-940 / show subscription management page - one round of pr comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'NEW', NULL, '2026-02-16 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'WIP', NULL, '2026-02-16 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'IN_REVIEW', NULL, '2026-02-18 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'PR_COMMENTS', NULL, '2026-02-19 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'IN_REVIEW', NULL, '2026-02-19 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'CUT_RELEASE', NULL, '2026-02-20 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'TESTING', 'v4.11.0', '2026-02-23 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'UAT', NULL, '2026-02-25 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), 'DONE', NULL, '2026-02-26 17:15:00'),

    -- NEB-945 / add csv export endpoint - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'NEW', NULL, '2026-02-19 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'WIP', NULL, '2026-02-19 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'IN_PR', NULL, '2026-02-20 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'IN_REVIEW', NULL, '2026-02-20 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'CUT_RELEASE', NULL, '2026-02-23 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'TESTING', 'v4.11.0', '2026-02-25 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'UAT', NULL, '2026-02-26 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), 'DONE', NULL, '2026-02-27 17:00:00'),

    -- NEB-945 / add export button to support console
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'NEW', NULL, '2026-02-19 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'WIP', NULL, '2026-02-19 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'IN_REVIEW', NULL, '2026-02-20 15:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'CUT_RELEASE', NULL, '2026-02-23 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'TESTING', 'v4.11.0', '2026-02-25 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'UAT', NULL, '2026-02-26 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), 'DONE', NULL, '2026-02-27 17:15:00'),

    -- NEB-951 / lazy-load non-critical checkout scripts - two rounds of in_review <-> pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'NEW', NULL, '2026-02-20 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'WIP', NULL, '2026-02-20 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'IN_REVIEW', NULL, '2026-02-23 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'PR_COMMENTS', NULL, '2026-02-24 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'IN_REVIEW', NULL, '2026-02-24 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'PR_COMMENTS', NULL, '2026-02-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'IN_REVIEW', NULL, '2026-02-25 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'CUT_RELEASE', NULL, '2026-02-26 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'TESTING', 'v4.11.1', '2026-02-27 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'UAT', NULL, '2026-02-28 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), 'DONE', NULL, '2026-03-01 17:00:00'),

    -- NEB-951 / add cdn caching for static checkout assets
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'NEW', NULL, '2026-02-20 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'WIP', NULL, '2026-02-20 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'IN_PR', NULL, '2026-02-23 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'IN_REVIEW', NULL, '2026-02-23 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'CUT_RELEASE', NULL, '2026-02-24 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'TESTING', 'v4.11.1', '2026-02-27 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'UAT', NULL, '2026-02-28 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), 'DONE', NULL, '2026-03-01 17:15:00');

-- tags: reuses several existing custom/repo tags, plus a handful of new
-- ones for the product areas these earlier sprints introduce.
INSERT INTO tags (name, tag_type) VALUES
    ('apple-pay', 'custom'),
    ('search', 'custom'),
    ('account-merge', 'custom'),
    ('billing', 'custom'),
    ('performance', 'custom'),
    ('export', 'custom'),
    ('search-service', 'repo'),
    ('user-service', 'repo');

INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES
    -- NEB-901: guest checkout, spanning payments + checkout + notifications
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-901'), (SELECT id FROM tags WHERE name = 'checkout')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-901'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-901'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-901'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'scaffold guest checkout page'), (SELECT id FROM tags WHERE name = 'frontend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add guest order creation endpoint'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'send guest checkout confirmation email'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-905: address autocomplete, backend + frontend
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-905'), (SELECT id FROM tags WHERE name = 'checkout')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-905'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-905'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate address lookup api client'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire autocomplete widget into checkout form'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-912: promo stacking rules
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-912'), (SELECT id FROM tags WHERE name = 'payments')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-912'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'enforce promo stacking rules in pricing engine'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'surface stacking error message in checkout ui'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-920: apple pay, backend + frontend
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-920'), (SELECT id FROM tags WHERE name = 'apple-pay')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-920'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-920'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'integrate apple pay merchant session api'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add apple pay button to checkout'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-925: search ranking, new search-service repo
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-925'), (SELECT id FROM tags WHERE name = 'search')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-925'), (SELECT id FROM tags WHERE name = 'search-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-925'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'tune bm25 weighting for product search'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add search relevance debug panel'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-931: account merge, new user-service repo
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-931'), (SELECT id FROM tags WHERE name = 'account-merge')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-931'), (SELECT id FROM tags WHERE name = 'user-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-931'), (SELECT id FROM tags WHERE name = 'notifications-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'detect duplicate accounts by email+phone'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'merge order history across accounts'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'notify user after account merge'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-940: subscription billing
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-940'), (SELECT id FROM tags WHERE name = 'billing')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-940'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-940'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add recurring charge scheduler'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'show subscription management page'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-945: csv export for support console
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-945'), (SELECT id FROM tags WHERE name = 'export')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-945'), (SELECT id FROM tags WHERE name = 'support-tooling')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-945'), (SELECT id FROM tags WHERE name = 'support-console')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add csv export endpoint'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add export button to support console'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-951: checkout latency, checkout-web only
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-951'), (SELECT id FROM tags WHERE name = 'performance')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-951'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'lazy-load non-critical checkout scripts'), (SELECT id FROM tags WHERE name = 'frontend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add cdn caching for static checkout assets'), (SELECT id FROM tags WHERE name = 'frontend'));

-- a few existing subtasks reclassified now that advanced types exist.
-- NEB-951's latency subtasks are performance optimisations, not debt;
-- NEB-925's debug panel is routine internal tooling rather than debt.
UPDATE subtasks SET type = 'perf'  WHERE title = 'lazy-load non-critical checkout scripts';
UPDATE subtasks SET type = 'perf'  WHERE title = 'add cdn caching for static checkout assets';
UPDATE subtasks SET type = 'chore' WHERE title = 'add search relevance debug panel';

-- ============================================================
-- SPRINT 3 (past, closed 2026-05-05) - "platform hardening"
-- sprint; stories collectively cover every subtask category type,
-- including one subtask left as 'unknown' (type not yet assigned).
-- ============================================================

INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES
    ('Nebula Checkout Sprint 3', '2026-04-21', '2026-05-05', NULL, 'Platform Hardening');

-- NEB-1110: security hardening - subtasks: security + test
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1110', 'NEB-1110',
     'Harden checkout against session replay attacks', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1110'),
     'add CSRF token validation to checkout form submission', 'security/neb-1110-csrf-tokens', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/601', 'checkout-web', 'v4.15.0', 3, 'security');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1110'),
     'write regression tests for session replay vector', 'test/neb-1110-session-replay-tests', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/602', 'checkout-web', 'v4.15.0', 2, 'test');

-- NEB-1115: latency reduction - subtasks: perf + spike
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1115', 'NEB-1115',
     'Reduce checkout API p95 latency', 8);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1115'),
     'add redis caching to product availability check', 'perf/neb-1115-availability-cache', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/240', 'payments-service', 'v4.15.0', 4, 'perf');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1115'),
     'profile payment processor integration for latency hotspots', 'spike/neb-1115-latency-profile', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/241', 'payments-service', 'v4.15.0', 3, 'spike');

-- NEB-1120: accessibility improvements - subtasks: feature + docs
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1120', 'NEB-1120',
     'Improve checkout accessibility', 3);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1120'),
     'add ARIA labels and roles to checkout form fields', 'feature/neb-1120-aria-labels', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/603', 'checkout-web', 'v4.15.0', 2, 'feature');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1120'),
     'write accessibility contribution guide for checkout-web', 'docs/neb-1120-a11y-guide', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/604', 'checkout-web', 'v4.15.0', 1, 'docs');

-- NEB-1125: bug - incorrect UK VAT post-Brexit - subtask: bugfix
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points, is_bug) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1125', 'NEB-1125',
     'Fix incorrect VAT shown for UK orders post-Brexit', 2, 1);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1125'),
     'correct UK VAT rate lookup after GB exit from EU tax zone', 'bugfix/neb-1125-uk-vat-rate', 'DONE',
     'https://github.com/nebula-labs/tax-engine/pull/82', 'tax-engine', 'v4.15.0', 2, 'bugfix');

-- NEB-1130: maintenance - subtasks: tech-debt + chore + unknown (unassigned)
INSERT INTO stories (sprint_id, jira_url, jira_key, description, story_points) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1130', 'NEB-1130',
     'Platform maintenance and cleanup', 5);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1130'),
     'replace deprecated moment.js calls with date-fns across checkout-web', 'tech-debt/neb-1130-moment-to-datefns', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/605', 'checkout-web', 'v4.15.0', 3, 'tech-debt');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1130'),
     'rotate payment processor API keys in staging and CI environments', 'chore/neb-1130-rotate-api-keys', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/242', 'payments-service', 'v4.15.0', 1, 'chore');

-- deliberately left untyped to exercise the 'unknown' default
INSERT INTO subtasks (story_id, title, status, type) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1130'),
     'audit third-party script dependencies for outdated versions', 'NEW', 'unknown');

INSERT INTO status_history (entity_type, entity_id, status, release_version, changed_at) VALUES
    -- NEB-1110 / add CSRF token validation - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'NEW', NULL, '2026-04-21 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'WIP', NULL, '2026-04-21 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'IN_PR', NULL, '2026-04-23 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'IN_REVIEW', NULL, '2026-04-23 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'CUT_RELEASE', NULL, '2026-04-24 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'TESTING', 'v4.15.0', '2026-04-28 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'UAT', NULL, '2026-04-30 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), 'DONE', NULL, '2026-05-01 17:00:00'),

    -- NEB-1110 / write regression tests for session replay vector
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'NEW', NULL, '2026-04-21 09:05:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'WIP', NULL, '2026-04-21 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'IN_PR', NULL, '2026-04-22 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'IN_REVIEW', NULL, '2026-04-22 17:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'CUT_RELEASE', NULL, '2026-04-23 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'TESTING', 'v4.15.0', '2026-04-28 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'UAT', NULL, '2026-04-30 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), 'DONE', NULL, '2026-05-01 17:15:00'),

    -- NEB-1115 / add redis caching - one round of pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'NEW', NULL, '2026-04-21 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'WIP', NULL, '2026-04-21 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'IN_PR', NULL, '2026-04-24 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'IN_REVIEW', NULL, '2026-04-24 17:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'PR_COMMENTS', NULL, '2026-04-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'IN_REVIEW', NULL, '2026-04-25 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'CUT_RELEASE', NULL, '2026-04-28 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'TESTING', 'v4.15.0', '2026-04-29 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'UAT', NULL, '2026-04-30 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), 'DONE', NULL, '2026-05-01 18:00:00'),

    -- NEB-1115 / profile latency hotspots - skips in_pr
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'NEW', NULL, '2026-04-22 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'WIP', NULL, '2026-04-22 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'IN_REVIEW', NULL, '2026-04-24 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'CUT_RELEASE', NULL, '2026-04-25 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'TESTING', 'v4.15.0', '2026-04-29 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'UAT', NULL, '2026-04-30 09:45:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), 'DONE', NULL, '2026-05-01 17:30:00'),

    -- NEB-1120 / add ARIA labels - skips pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'NEW', NULL, '2026-04-23 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'WIP', NULL, '2026-04-23 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'IN_PR', NULL, '2026-04-24 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'IN_REVIEW', NULL, '2026-04-24 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'CUT_RELEASE', NULL, '2026-04-25 10:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'TESTING', 'v4.15.0', '2026-04-28 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'UAT', NULL, '2026-04-30 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), 'DONE', NULL, '2026-05-02 09:00:00'),

    -- NEB-1120 / write accessibility guide - straight through, no oscillation
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'NEW', NULL, '2026-04-24 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'WIP', NULL, '2026-04-24 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'IN_REVIEW', NULL, '2026-04-25 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'CUT_RELEASE', NULL, '2026-04-25 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'TESTING', 'v4.15.0', '2026-04-28 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'UAT', NULL, '2026-04-30 10:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), 'DONE', NULL, '2026-05-02 09:15:00'),

    -- NEB-1125 / correct UK VAT rate - hotfix path, skips in_pr and pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'NEW', NULL, '2026-04-21 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'WIP', NULL, '2026-04-21 14:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'IN_REVIEW', NULL, '2026-04-22 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'CUT_RELEASE', NULL, '2026-04-22 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'TESTING', 'v4.15.0', '2026-04-23 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'UAT', NULL, '2026-04-23 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), 'DONE', NULL, '2026-04-24 09:00:00'),

    -- NEB-1130 / replace moment.js - two rounds of pr_comments
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'NEW', NULL, '2026-04-21 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'WIP', NULL, '2026-04-21 09:20:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'IN_PR', NULL, '2026-04-23 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'IN_REVIEW', NULL, '2026-04-24 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'PR_COMMENTS', NULL, '2026-04-24 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'IN_REVIEW', NULL, '2026-04-25 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'PR_COMMENTS', NULL, '2026-04-25 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'IN_REVIEW', NULL, '2026-04-28 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'CUT_RELEASE', NULL, '2026-04-28 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'TESTING', 'v4.15.0', '2026-04-29 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'UAT', NULL, '2026-05-01 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), 'DONE', NULL, '2026-05-02 17:00:00'),

    -- NEB-1130 / rotate API keys - operational, fast path
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'NEW', NULL, '2026-04-22 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'WIP', NULL, '2026-04-22 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'IN_REVIEW', NULL, '2026-04-22 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'CUT_RELEASE', NULL, '2026-04-22 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'TESTING', 'v4.15.0', '2026-04-23 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'UAT', NULL, '2026-04-23 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), 'DONE', NULL, '2026-04-24 10:00:00'),

    -- NEB-1130 / dep audit - left as NEW, no further progress
    ('subtask', (SELECT id FROM subtasks WHERE title = 'audit third-party script dependencies for outdated versions'), 'NEW', NULL, '2026-04-28 09:00:00');

INSERT INTO tags (name, tag_type) VALUES
    ('security', 'custom'),
    ('accessibility', 'custom');

INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES
    -- NEB-1110: security hardening
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1110'), (SELECT id FROM tags WHERE name = 'security')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1110'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add CSRF token validation to checkout form submission'), (SELECT id FROM tags WHERE name = 'frontend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write regression tests for session replay vector'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1115: latency
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1115'), (SELECT id FROM tags WHERE name = 'latency')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1115'), (SELECT id FROM tags WHERE name = 'performance')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1115'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add redis caching to product availability check'), (SELECT id FROM tags WHERE name = 'backend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'profile payment processor integration for latency hotspots'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1120: accessibility
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1120'), (SELECT id FROM tags WHERE name = 'accessibility')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1120'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add ARIA labels and roles to checkout form fields'), (SELECT id FROM tags WHERE name = 'frontend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'write accessibility contribution guide for checkout-web'), (SELECT id FROM tags WHERE name = 'frontend')),

    -- NEB-1125: UK VAT bug
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1125'), (SELECT id FROM tags WHERE name = 'bug')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1125'), (SELECT id FROM tags WHERE name = 'tax')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1125'), (SELECT id FROM tags WHERE name = 'tax-engine')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'correct UK VAT rate lookup after GB exit from EU tax zone'), (SELECT id FROM tags WHERE name = 'backend')),

    -- NEB-1130: maintenance
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1130'), (SELECT id FROM tags WHERE name = 'reliability')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1130'), (SELECT id FROM tags WHERE name = 'checkout-web')),
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1130'), (SELECT id FROM tags WHERE name = 'payments-service')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'replace deprecated moment.js calls with date-fns across checkout-web'), (SELECT id FROM tags WHERE name = 'frontend')),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'rotate payment processor API keys in staging and CI environments'), (SELECT id FROM tags WHERE name = 'backend'));
