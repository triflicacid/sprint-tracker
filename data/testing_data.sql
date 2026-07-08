-- NOTE this test data is AI generated

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

-- ============================================================
-- SPRINT 1 (past, closed 2026-03-16) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-1001, 3 subtasks, all DONE (one with a two-round pr-comments
-- oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1001', 'NEB-1001',
     'Support saved payment methods at checkout');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'add saved card list endpoint', 'feature/neb-1001-saved-cards-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/214', 'payments-service', 'v4.12.0', 2);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'render saved card selector in checkout ui', 'feature/neb-1001-checkout-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/588', 'checkout-web', 'v4.12.0', 1);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1001'),
     'add card deletion endpoint', 'feature/neb-1001-delete-card', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/215', 'payments-service', 'v4.12.0', 3);

-- story: NEB-1004, jira only, no subtasks yet - kept as a "just a jira
-- ticket, no code work started" example.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1004', 'NEB-1004',
     'Investigate intermittent double-charge reports');

-- story: NEB-1010, 2 subtasks, both DONE (one with a single-round
-- in_pr <-> in_review oscillation).
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 1'),
     'https://nebula.atlassian.net/browse/NEB-1010', 'NEB-1010',
     'Add fraud-score check before charging');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1010'),
     'integrate fraud scoring api client', 'feature/neb-1010-fraud-client', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/216', 'payments-service', 'v4.12.0', 2);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1010'),
     'block checkout above fraud threshold', 'feature/neb-1010-fraud-block', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/589', 'checkout-web', 'v4.12.0', 4);

-- ============================================================
-- SPRINT 2 (past, closed 2026-03-30) - every subtask reaches DONE.
-- ============================================================

-- story: NEB-1032, 2 subtasks, both DONE (one continues the existing
-- in_pr <-> in_review oscillation through to release).
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1032', 'NEB-1032',
     'Add regional tax calculation for EU checkout');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1032'),
     'integrate vat rate lookup service', 'feature/neb-1032-vat-lookup', 'DONE',
     'https://github.com/nebula-labs/tax-engine/pull/77', 'tax-engine', 'v4.13.0', 3);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1032'),
     'surface tax breakdown in order summary', 'feature/neb-1032-tax-breakdown-ui', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/590', 'checkout-web', 'v4.13.0', 2);

-- story: NEB-1040, 2 subtasks, both DONE (one continues the existing
-- pr-comments <-> in-review oscillation - two rounds of feedback total).
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1040', 'NEB-1040',
     'Retry failed webhook deliveries automatically');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1040'),
     'add exponential backoff to webhook dispatcher', 'feature/neb-1040-webhook-retry', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/301', 'notifications-service', 'v4.13.1', 4);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1040'),
     'add dead-letter queue for exhausted retries', 'feature/neb-1040-dlq', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/302', 'notifications-service', 'v4.13.0', 3);

-- story: NEB-1045, 2 subtasks, both DONE.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 2'),
     'https://nebula.atlassian.net/browse/NEB-1045', 'NEB-1045',
     'Send webhook delivery status to customer dashboard');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1045'),
     'add delivery-status api endpoint', 'feature/neb-1045-status-api', 'DONE',
     'https://github.com/nebula-labs/notifications-service/pull/303', 'notifications-service', 'v4.13.0', 2);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1045'),
     'render delivery status widget', 'feature/neb-1045-status-widget', 'DONE',
     'https://github.com/nebula-labs/checkout-web/pull/591', 'checkout-web', 'v4.13.0', 4);

-- ============================================================
-- SPRINT 3 (current, open - no end_date) - a mix: some subtasks reach
-- DONE, most sit mid-flight at earlier stages.
-- ============================================================

-- story: NEB-1058, 1 subtask - pushed all the way to DONE this time, to
-- show a current-sprint item that's actually finished.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1058', 'NEB-1058',
     'Allow partial refunds from the support console');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1058'),
     'add partial refund endpoint', 'feature/neb-1058-partial-refund-api', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/229', 'payments-service', 'v4.14.0', 3);

-- story: NEB-1061, 1 subtask - deliberately left at UAT (not done yet),
-- showing work still in flight this sprint.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1061', 'NEB-1061',
     'Show refund status timeline to support agents');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1061'),
     'build refund timeline component', 'feature/neb-1061-refund-timeline', 'UAT',
     'https://github.com/nebula-labs/support-console/pull/142', 'support-console', 'v4.13.0');

-- story: NEB-1070, 3 subtasks spanning done / done / just started,
-- including a two-round in_review <-> pr_comments oscillation.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1070', 'NEB-1070',
     'Support multi-currency refunds');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1070'),
     'add currency conversion helper', 'feature/neb-1070-fx-helper', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/230', 'payments-service', 'v4.14.0', 2);

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, release_version, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1070'),
     'wire multi-currency refund endpoint', 'feature/neb-1070-fx-endpoint', 'DONE',
     'https://github.com/nebula-labs/payments-service/pull/231', 'payments-service', 'v4.14.0', 5);

INSERT INTO subtasks (story_id, title, branch_name, status) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1070'),
     'add currency selector to refund form', 'feature/neb-1070-fx-selector', 'WIP');

-- story: NEB-1075, 2 subtasks, both early/mid-flight (one not started at all).
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1075', 'NEB-1075',
     'Add refund audit log');

INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, complexity_rating) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1075'),
     'create audit log table and write path', 'feature/neb-1075-audit-log', 'IN_PR',
     'https://github.com/nebula-labs/payments-service/pull/232', 'payments-service', 2);

INSERT INTO subtasks (story_id, title, status) VALUES
    ((SELECT id FROM stories WHERE jira_key = 'NEB-1075'),
     'expose audit log to support ui', 'NEW');

-- story: NEB-1080, jira only, no subtasks yet - not every ticket in the
-- current sprint has code work started either.
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES
    ((SELECT id FROM sprints WHERE name = 'Nebula Checkout Sprint 3'),
     'https://nebula.atlassian.net/browse/NEB-1080', 'NEB-1080',
     'Investigate refund latency spike');

-- ============================================================
-- status_history: every subtask's full transition path from NEW up to its
-- current status, dated within its sprint and following
-- static/statusFlow.json (some steps skipped where the flow allows it,
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
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'NEW', NULL, '2026-03-30 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'WIP', NULL, '2026-03-30 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'IN_REVIEW', NULL, '2026-04-01 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'PR_COMMENTS', NULL, '2026-04-02 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'CUT_RELEASE', NULL, '2026-04-02 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'TESTING', 'v4.14.0', '2026-04-07 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'UAT', NULL, '2026-04-09 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add partial refund endpoint'), 'DONE', NULL, '2026-04-10 17:00:00'),

    -- NEB-1061 / build refund timeline component - still in flight, ends at uat
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'NEW', NULL, '2026-03-31 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'WIP', NULL, '2026-03-31 09:15:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'IN_REVIEW', NULL, '2026-04-02 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'PR_COMMENTS', NULL, '2026-04-03 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'CUT_RELEASE', NULL, '2026-04-03 15:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'TESTING', 'v4.13.0', '2026-04-07 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'build refund timeline component'), 'UAT', NULL, '2026-04-09 09:00:00'),

    -- NEB-1070 / add currency conversion helper - done, no oscillation
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'NEW', NULL, '2026-03-31 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'WIP', NULL, '2026-03-31 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'IN_PR', NULL, '2026-04-01 11:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'IN_REVIEW', NULL, '2026-04-01 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'CUT_RELEASE', NULL, '2026-04-01 18:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'TESTING', 'v4.14.0', '2026-04-07 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'UAT', NULL, '2026-04-09 09:30:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency conversion helper'), 'DONE', NULL, '2026-04-10 17:30:00'),

    -- NEB-1070 / wire multi-currency refund endpoint - two rounds of pr comments,
    -- pushed through to done.
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'NEW', NULL, '2026-04-01 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'WIP', NULL, '2026-04-01 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_PR', NULL, '2026-04-02 13:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_REVIEW', NULL, '2026-04-03 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'PR_COMMENTS', NULL, '2026-04-03 15:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_REVIEW', NULL, '2026-04-04 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'PR_COMMENTS', NULL, '2026-04-04 14:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'IN_REVIEW', NULL, '2026-04-05 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'CUT_RELEASE', NULL, '2026-04-05 16:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'TESTING', 'v4.14.0', '2026-04-07 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'UAT', NULL, '2026-04-09 10:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'wire multi-currency refund endpoint'), 'DONE', NULL, '2026-04-10 18:00:00'),

    -- NEB-1070 / add currency selector to refund form - just started
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency selector to refund form'), 'NEW', NULL, '2026-04-03 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'add currency selector to refund form'), 'WIP', NULL, '2026-04-03 09:15:00'),

    -- NEB-1075 / create audit log table and write path - mid-flight, no review yet
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), 'NEW', NULL, '2026-04-04 09:00:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), 'WIP', NULL, '2026-04-04 09:10:00'),
    ('subtask', (SELECT id FROM subtasks WHERE title = 'create audit log table and write path'), 'IN_PR', NULL, '2026-04-06 11:00:00'),

    -- NEB-1075 / expose audit log to support ui - not started
    ('subtask', (SELECT id FROM subtasks WHERE title = 'expose audit log to support ui'), 'NEW', NULL, '2026-04-05 09:00:00');

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
    ('story', (SELECT id FROM stories WHERE jira_key = 'NEB-1080'), (SELECT id FROM tags WHERE name = 'reliability'));
