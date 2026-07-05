-- transcribed from data/Work Log.md (see backup of the previous, partial
-- transcription at data/existing_history.sql.bak). sprints are listed oldest
-- first. five sprints near the bottom (Sprint 1, In-Between, Sprint 21-23) had
-- no explicit dates in the source log - their dates are estimated backward from
-- Sprint 2 (2025-10-30, the first dated sprint) using the ~2-week cadence seen
-- throughout the rest of the log; this is flagged in each such sprint's comment.

INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 21', '2025-08-28', '2025-09-11', '(dates estimated - not given in source log)');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 22', '2025-09-11', '2025-09-25', '(dates estimated - not given in source log)');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 23', '2025-09-25', '2025-10-09', '(dates estimated - not given in source log)');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('In-Between', '2025-10-09', '2025-10-16', 'One week gap period after Tickets & Blotters'' team split (dates estimated - not given in source log)');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 1', '2025-10-16', '2025-10-30', 'Sick for the first half of the sprint (dates estimated - not given in source log)');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 2', '2025-10-30', '2025-11-13', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 3', '2025-11-14', '2025-11-27', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 4', '2025-12-04', '2025-12-17', 'Took two days off');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 5', '2025-12-17', '2026-01-07', 'Three-week sprint; BE took a lot of holiday');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 6', '2026-01-07', '2026-01-21', 'Not much work to do besides helping others, also had TDD training and took a day off for an appointment');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Sprint 7', '2026-01-21', '2026-02-04', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Interim (Sprint 8)', '2026-02-04', '2026-02-11', 'Interim 1-week sprint between finishing Venue Management and starting Quick T-Plan');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 1', '2026-02-11', '2026-02-25', '5-day holiday');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 2', '2026-02-25', '2026-03-12', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 3', '2026-03-12', '2026-03-25', '3-day holiday');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 4', '2026-03-26', '2026-04-08', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 5', '2026-04-09', '2026-04-21', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 6', '2026-04-22', '2026-05-05', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 7', '2026-05-06', '2026-05-20', 'Bank holiday, ill for two days');
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 8', '2026-05-20', '2026-06-03', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 9', '2026-06-03', '2026-06-17', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Quick T-Plan Sprint 10', '2026-06-17', '2026-07-01', NULL);
INSERT INTO sprints (name, start_date, end_date, comment) VALUES ('Futures Market Grid Sprint 1', '2026-07-01', NULL, NULL);

-- Futures Market Grid Sprint 1
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Futures Market Grid Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-46855', 'BID-46855', 'Persist user-edited QTP fields (FX)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1372', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'TESTING', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1374', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-feature-flags/pull/479', 'terraform-feature-flags');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Futures Market Grid Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-46643', 'BID-46643', 'Add EOM order expiry to quick order (FX)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'TESTING', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1375', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Futures Market Grid Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-46702', 'BID-46702', 'Add EOM order expiry to quick order (MFX)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/142', 'ticket-storage-service');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'TESTING', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1377', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Futures Market Grid Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-46703', 'BID-46703', 'Add EOM to QO preference');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'PR_COMMENTS', 'https://github.com/sgx-fx-bidfx/preference-service/pull/270', 'preference-service');

-- Quick T-Plan Sprint 10
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'https://sgxfx.atlassian.net/browse/BID-32447', 'BID-32447', 'EOM for SE');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/160', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/250', 'strategy-engine-algos');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1354', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/694', 'cash-ticket-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/t-plan/pull/1234', 't-plan');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/csv-upload-rep/pull/197', 'csv-upload-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/mobile-blotter/pull/10', 'mobile-blotter');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'https://sgxfx.atlassian.net/browse/BID-46201', 'BID-46201', 'Refresh quick t-plan (FX)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1352', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1353', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1357', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1358', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1361', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'https://sgxfx.atlassian.net/browse/BID-46340', 'BID-46340', 'Refresh quick t-plan (MFX)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1361', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'https://sgxfx.atlassian.net/browse/BID-45427', 'BID-45427', 'Test migration cash (E2E)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2191', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3968', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'https://sgxfx.atlassian.net/browse/BID-46829', 'BID-46829', 'Bug: cross market filter not disabled in MFX');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2204', 'qa-acceptance-tests');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'https://sgxfx.atlassian.net/browse/BID-46866', 'BID-46866', 'QTP: provide TOB prices on submission');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1366', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1370', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 10'), 'NOJIRA', NULL, 'untracked work');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2208', 'qa-acceptance-tests');

-- Quick T-Plan Sprint 9
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 9'), 'https://sgxfx.atlassian.net/browse/BID-46642', 'BID-46642', 'Add EOM to Bank Algos');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-feature-flags/pull/467', 'terraform-feature-flags');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/157', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/247', 'strategy-engine-algos');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1340', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/690', 'cash-ticket-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/admin-engine/pull/337', 'admin-engine');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/158', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/159', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2152', 'qa-acceptance-tests');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 9'), 'https://sgxfx.atlassian.net/browse/BID-32447', 'BID-32447', 'Add EOM to Strategy Engine');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/248', 'strategy-engine-algos');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1346', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/692', 'cash-ticket-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2164', 'qa-acceptance-tests');

-- Quick T-Plan Sprint 8
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 8'), 'https://sgxfx.atlassian.net/browse/BID-20897', 'BID-20897', 'Bank Algo Order Duration preference');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/preference-service/pull/266', 'preference-service');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/154', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1332', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/688', 'cash-ticket-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 8'), 'https://sgxfx.atlassian.net/browse/BID-46162', 'BID-46162', 'Bank Algo Bank-Specified Order Duration');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/156', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/244', 'strategy-engine-algos');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/689', 'cash-ticket-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1337', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 8'), 'https://sgxfx.atlassian.net/browse/BID-45470', 'BID-45470', 'Migration, Cash Ticket, E2E');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2055', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3954', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 8'), 'https://sgxfx.atlassian.net/browse/BID-45450', 'BID-45450', 'Migration, Cash Ticket, E2E');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2083', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3956', 'qa-client');

-- Quick T-Plan Sprint 7
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-46188', 'BID-46188', 'Submit Quick T-plan');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-feature-flags/pull/457', 'terraform-feature-flags');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1312', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1313', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1320', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1327', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 7'), 'NOJIRA', NULL, 'Bugfix with quick order submissions found while doing above ticket');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1314', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-46189', 'BID-46189', 'Create Quick T-Plan (communicate w/ T-plan)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1316', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 7'), 'NOJIRA', NULL, 'Split tickets & blotters, finally');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-github/pull/360', 'terraform-github');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-45613', 'BID-45613', 'Quick T-Plan MFX Validation');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/client-consts-types/pull/147', 'client-consts-types');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/client-multi-fx/pull/2277', 'client-multi-fx');

-- Quick T-Plan Sprint 6
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 6'), 'https://sgxfx.atlassian.net/browse/BID-45614', 'BID-45614', 'Quick T-Plan In The Money (FX ticket)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1299', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1302', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1308', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 6'), 'https://sgxfx.atlassian.net/browse/BID-45923', 'BID-45923', 'Quick T-Plan In The Money, OR group');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1303', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 6'), 'https://sgxfx.atlassian.net/browse/BID-45921', 'BID-45921', 'Quick T-Plan In The Money (MFX)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1309', 'click-trade-rep');

-- Quick T-Plan Sprint 5
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-46139', 'BID-46139', 'Disable quick t-plan when multi-legged deal type');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1289', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-45615', 'BID-45615', 'Quick T-plan trade directions');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1290', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1292', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 5'), 'NOJIRA', NULL, 'NOJIRA: consistency in API examples');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1291', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 5'), 'NOJIRA', NULL, 'New itest for disabling components when multi-legged');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1294', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-45785', 'BID-45785', 'Preferences cash-ticket tech debt');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/680', 'cash-ticket-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 5'), 'https://sgxfx.atlassian.net/browse/BIZ-12899', 'BIZ-12899', 'Dev escalation');

-- Quick T-Plan Sprint 4
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 4'), 'https://sgxfx.atlassian.net/browse/BID-46037', 'BID-46037', 'Cash Ticket NPE');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/677', 'cash-ticket-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 4'), 'https://sgxfx.atlassian.net/browse/BID-45469', 'BID-45469', 'Test migration (cash, E2E)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1816', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3914', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 4'), 'https://sgxfx.atlassian.net/browse/BID-45609', 'BID-45609', 'Editable Quick T-Plan fields');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1282', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1285', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1283', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1287', 'click-trade-rep');

-- Quick T-Plan Sprint 3
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-45816', 'BID-45816', 'TSS MPI');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1269', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1270', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1733', 'qa-acceptance-tests');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-45832', 'BID-45832', 'QT-11a: fields in quick t-plan entry');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1273', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1274', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-45404', 'BID-45404', 'Test migration (cash, E2E)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1739', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3902', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-45607', 'BID-45607', 'QT-11b: pre-populate entry fields');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1278', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1280', 'click-trade-rep');

-- Quick T-Plan Sprint 2
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 2'), 'https://sgxfx.atlassian.net/browse/BID-45677', 'BID-45677', 'Click-trade tech debt');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1255', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1256', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1257', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1258', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1260', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 2'), 'https://sgxfx.atlassian.net/browse/BID-45603', 'BID-45603', 'Quick T-Plan template on ticket');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1261', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1262', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1266', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 2'), 'NOJIRA', NULL, 'Action TODO in qa-acceptance tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1691', 'qa-acceptance-tests');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 2'), 'NOJIRA', NULL, 'Quick T-Plan config changes');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1267', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 2'), 'NOJIRA', NULL, 'Testing QT-09');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1699', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1702', 'qa-acceptance-tests');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 2'), 'NOJIRA', NULL, 'Upgraded deprecated nagios alerter in `example-rep`');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/example-rep/pull/141', 'example-rep');

-- Quick T-Plan Sprint 1
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 1'), 'NOJIRA', NULL, 'untracked work');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/ci-config/pull/235', 'ci-config');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-45557', 'BID-45557', 'Bug: TSS redis thread getting stuck');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/138', 'ticket-storage-service');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-45575', 'BID-45575', 'Click-trade: add Quick T-Plan component');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1249', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Quick T-Plan Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-45682', 'BID-45682', 'untracked work');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1665', 'qa-acceptance-tests');

-- Interim (Sprint 8)
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-42665', 'BID-42665', 'Migrate `FXTicketMandatoryFields` tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/232', 'strategy-engine-algos');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/148', 'bank-algo-parser');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1238', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3850', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45457', 'BID-45457', 'Migrate `CashTicketMandatoryFields` tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/670', 'cash-ticket-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3851', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45431', 'BID-45431', 'Test migration (BE)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3854', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45405', 'BID-45405', 'Test migration (E2E)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1603', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3856', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45519', 'BID-45519', 'Test migration (BE)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/671', 'cash-ticket-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45428', 'BID-45428', 'Test migration (BE)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1242', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3858', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45448', 'BID-45448', 'Test migration (E2E)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1608', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3859', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Interim (Sprint 8)'), 'https://sgxfx.atlassian.net/browse/BID-45429', 'BID-45429', 'Test migration (E2E)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1610', 'qa-acceptance-tests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3861', 'qa-client');

-- Sprint 7
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/CR-31979', 'CR-31979', 'UAT');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/CR-31980', 'CR-31980', 'PROD');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'NOJIRA', NULL, 'Click-trade: VM-14');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/65', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-45321', 'BID-45321', 'Click trade: avoid repeated building of ticket');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1224', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-45327', 'BID-45327', 'Ticket storage service: support GCP alerts');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/136', 'ticket-storage-service');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-dev/pull/2420', 'k8s-gitops-dev');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'NOJIRA', NULL, 'DEVESC: NPE in tab header bar updater handler');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1227', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-45346', 'BID-45346', 'Click-trade: VM-14b');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-45275', 'BID-45275', 'Venue-management: VM-14c');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1231', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'https://sgxfx.atlassian.net/browse/BID-45360', 'BID-45360', 'Click-trade: bug: Leaking user-specific TabManager into ''global'' (REP) TicketValidator');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1230', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 7'), 'NOJIRA', NULL, 'Fix failing Cash Openfin test');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3841', 'qa-client');

-- Sprint 6
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 6'), 'NOJIRA', NULL, 'Spike for endpoint testing');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/63', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 6'), 'NOJIRA', NULL, 'Maintenance - code cleanup');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/trade-rep/pull/372', 'trade-rep');

-- Sprint 5
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-44993', 'BID-44993', 'Venue management: tech debt');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/52', 'venue-management');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/61', 'venue-management');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/15026', 'k8s-gitops-prod');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/15028', 'k8s-gitops-prod');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-45016', 'BID-45016', 'Venue management: add field names to validation failure responses');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/53', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-45043', 'BID-45043', 'Venue management: modify `GET /users` endpoint');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/54', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'https://sgxfx.atlassian.net/browse/BID-45090', 'BID-45090', 'Venue management: set up privileged users');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/57', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'NOJIRA', NULL, 'Gitops dev: typo in Sesame account name `fxveuenmgt`');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-dev/pull/2391', 'k8s-gitops-dev');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'NOJIRA', NULL, 'Venue management: clean-up imports');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/59', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'https://sgxfx.atlassian.net/browse/CR-29965', 'CR-29965', 'Venue management to prod');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13760', 'k8s-gitops-prod');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-gcp/pull/3602', 'terraform-gcp');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 5'), 'NOJIRA', NULL, 'Investigate qa bug: fx ticket');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1465', 'qa-acceptance-tests');

-- Sprint 4
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 4'), 'https://sgxfx.atlassian.net/browse/BID-44806', 'BID-44806', 'Venue management: delete a venue plan');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/45', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 4'), 'https://sgxfx.atlassian.net/browse/BID-44808', 'BID-44808', 'Venue management: view branch user assignments');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/45', 'venue-management');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/admin-bridge/pull/325', 'admin-bridge');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 4'), 'https://sgxfx.atlassian.net/browse/BID-44916', 'BID-44916', 'Venue management: include number of users assigned to the plan on its summary');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/47', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 4'), 'NOJIRA', NULL, 'Venue management: sorting users assigned to a plan');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/49', 'venue-management');

-- Sprint 3
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/CR-30251', 'CR-30251', 'Deploy venue management to PROD');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13760', 'k8s-gitops-prod');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'NOJIRA', NULL, 'ci-config changes to spin-up pods');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/ci-config/pull/184', 'ci-config');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'NOJIRA', NULL, 'Renamed venue management service account');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-dev/pull/2373', 'k8s-gitops-dev');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44457', 'BID-44457', 'MFX: Add Off venue to tab header bar dropdown');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1206', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44530', 'BID-44530', 'Rename fields in venue-management');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/23', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44517', 'BID-44517', 'Define API for creating a new venue plan');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/22', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44518', 'BID-44518', 'Create venue plan in rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/25', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44519', 'BID-44519', 'Create venue plan in service');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/26', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'NOJIRA', NULL, 'Add query param `buyside_default` (change request by Ed)');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/30', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44553', 'BID-44553', 'Define API for updating the assigned users');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/27', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'NOJIRA', NULL, 'Venue management bugfix - add passwords to self-service requests');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/35', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 3'), 'https://sgxfx.atlassian.net/browse/BID-44764', 'BID-44764', 'Venue management: get venue plan: implement missing 304 response');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/39', 'venue-management');

-- Sprint 2
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 2'), 'NOJIRA', NULL, '(Started) database setup');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/10', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 2'), 'NOJIRA', NULL, 'Update trade API in qa-client');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/qa-client/pull/3806', 'qa-client');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 2'), 'https://sgxfx.atlassian.net/browse/BID-44263', 'BID-44263', 'Deploy `venue-management` to PROD');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13760', 'k8s-gitops-prod');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 2'), 'NOJIRA', NULL, 'Added get venue plan to rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/15', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 2'), 'NOJIRA', NULL, '(Helped with tail end of) Adding get venue summaries on service');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/venue-management/pull/13', 'venue-management');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 2'), 'https://sgxfx.atlassian.net/browse/BID-44419', 'BID-44419', 'Update "Off" to "OFF" in click-trade and cash-ticket');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1205', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/659', 'cash-ticket-rep');

-- Sprint 1
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 1'), 'NOJIRA', NULL, 'Upgrade deprecated functions, mainly `getAlerts` -> `getAlerter`.');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/653', 'cash-ticket-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1202', 'click-trade-rep');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/134', 'ticket-storage-service');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 1'), 'NOJIRA', NULL, 'Help set up `venue-management` repo & service');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 1'), 'https://sgxfx.atlassian.net/browse/BID-44262', 'BID-44262', 'Deploy `venue-management` to UAT');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-gcp/pull/3344', 'terraform-gcp');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13032', 'k8s-gitops-prod');

-- In-Between
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'In-Between'), 'NOJIRA', NULL, 'Cash Ticket test fixes');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/646', 'cash-ticket-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'In-Between'), 'https://sgxfx.atlassian.net/browse/BID-40299', 'BID-40299', 'FX Ticket: honouring BV preference');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1198', 'click-trade-rep');

-- Sprint 23
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'https://sgxfx.atlassian.net/browse/BID-43730', 'BID-43730', 'Position Blotter: Clean up feature flags');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/position-rep/pull/120', 'position-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'https://sgxfx.atlassian.net/browse/BID-43694', 'BID-43694', 'Trade Blotter: Pause single order');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-ops/terraform-feature-flags/pull/383', 'terraform-feature-flags');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-om-bridge/pull/492', 'cash-om-bridge');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'NOJIRA', NULL, 'Bug fixes for tab header bar.');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1191', 'click-trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'https://sgxfx.atlassian.net/browse/BID-43731', 'BID-43731', 'Archive: Clean up feature flags');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'https://sgxfx.atlassian.net/browse/BID-43695', 'BID-43695', 'Trade Blotter: Pause multiple orders');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/trade-rep/pull/340', 'trade-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'https://sgxfx.atlassian.net/browse/BID-43696', 'BID-43696', 'Cash Ticket: Pause orders');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/642', 'cash-ticket-rep');
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 23'), 'https://sgxfx.atlassian.net/browse/BID-27918', 'BID-27918', 'Click Trade: Clean Up Log Noise');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1194', 'click-trade-rep');

-- Sprint 22
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 22'), 'https://sgxfx.atlassian.net/browse/BID-43444', 'BID-43444', 'Multi-FX: header bar venue override');

-- Sprint 21
INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES ((SELECT id FROM sprints WHERE name = 'Sprint 21'), 'https://sgxfx.atlassian.net/browse/BID-42843', 'BID-42843', 'Cash ticket: add venue component to Cash Ticket');
INSERT INTO subtasks (story_id, description, branch_name, status, url, repo_name) VALUES ((SELECT id FROM stories ORDER BY id DESC LIMIT 1), 'branch work', '(unknown)', 'DONE', 'https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/629', 'cash-ticket-rep');

-- holidays inferred from sprint comments in the Work Log - exact dates were
-- not given (just a day count per sprint), so each is placed as the first N
-- weekdays of that sprint. adjust dates if the actual days differ.
-- Quick T-Plan Sprint 1: 5-day holiday
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-02-11');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-02-12');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-02-13');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-02-16');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-02-17');
-- Quick T-Plan Sprint 3: 3-day holiday
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-12');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-13');
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-03-16');
-- Quick T-Plan Sprint 7: bank holiday (placed on a Monday)
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-05-11');
-- Sprint 6: appointment day off
INSERT OR IGNORE INTO holidays (date) VALUES ('2026-01-07');
-- Sprint 4: took two days off
INSERT OR IGNORE INTO holidays (date) VALUES ('2025-12-04');
INSERT OR IGNORE INTO holidays (date) VALUES ('2025-12-05');