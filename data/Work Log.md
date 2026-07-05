> [!warning] Remember
> - Triple-check BID numbers when creating branches and commits

$$
\newcommand{\tagjira}{\color{gray}{\textsf{[JIRA ITEMS]}}}
\newcommand{\tagpartialwip}{\color{brown}{\textsf{[PARTIAL WIP]}}}
\newcommand{\tagwip}{\color{orange}{\textsf{[WIP]}}}
\newcommand{\taginpr}{\color{blue}{\textsf{[IN PR]}}}
\newcommand{\tagunmerged}{\color{red}{\textsf{[UNMERGED]}}}
\newcommand{\tagcutrelease}{\color{purple}{\textsf{[CUT RELEASE]}}}
\newcommand{\tagintesting}{\color{teal}{\textsf{[IN TESTING]}}}
\newcommand{\taginuat}{\color{green}{\textsf{[IN UAT]}}}
$$
# Futures Market Grid Sprint 1
> 01/07/2026-

- https://sgxfx.atlassian.net/browse/BID-46855 | Persist user-edited QTP fields (FX)
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1372
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1374/ $\tagintesting$
	- https://github.com/sgx-fx-ops/terraform-feature-flags/pull/479
- https://sgxfx.atlassian.net/browse/BID-46643 | Add EOM order expiry to quick order (FX)
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1375/ $\tagintesting$
- https://sgxfx.atlassian.net/browse/BID-46702 | Add EOM order expiry to quick order (MFX)
	- https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/142
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1377 $\tagintesting$
- https://sgxfx.atlassian.net/browse/BID-46703 | Add EOM to QO preference
	- https://github.com/sgx-fx-bidfx/preference-service/pull/270 $\tagunmerged$
# Quick T-Plan Sprint 10
> 17/06/2026-01/07/2026

- https://sgxfx.atlassian.net/browse/BID-32447 | EOM for SE
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/160
	- https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/250
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1354
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/694
	- https://github.com/sgx-fx-bidfx/t-plan/pull/1234
	- https://github.com/sgx-fx-bidfx/csv-upload-rep/pull/197
	- https://github.com/sgx-fx-bidfx/mobile-blotter/pull/10
- https://sgxfx.atlassian.net/browse/BID-46201 | Refresh quick t-plan (FX)
	- API: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1352
	- indicate stale: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1353/
	- API 2: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1357
	- refresh: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1358
	- MFX https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1361 !
- https://sgxfx.atlassian.net/browse/BID-46340 | Refresh quick t-plan (MFX)
	- API is [here](https://sgxfx.atlassian.net/wiki/spaces/BID/pages/1594422556/MultiFX+v2+Workspace+Migration+API) (documented in [this ticket](https://sgxfx.atlassian.net/browse/BID-46850))
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1361
- https://sgxfx.atlassian.net/browse/BID-45427 | Test migration cash (E2E)
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2191
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3968
- https://sgxfx.atlassian.net/browse/BID-46829 | Bug: cross market filter not disabled in MFX
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2204
- https://sgxfx.atlassian.net/browse/BID-46866 | QTP: provide TOB prices on submission
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1366
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1370
- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2208
# Quick T-Plan Sprint 9
> 03/06/2026-17/06/2026

- https://sgxfx.atlassian.net/browse/BID-46642 | Add EOM to Bank Algos
	- https://github.com/sgx-fx-ops/terraform-feature-flags/pull/467
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/157
	- https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/247
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1340
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/690
	- https://github.com/sgx-fx-bidfx/admin-engine/pull/337
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/158
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/159
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2152
- https://sgxfx.atlassian.net/browse/BID-32447 | Add EOM to Strategy Engine
	- https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/248
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1346
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/692
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2164
# Quick T-Plan Sprint 8
> 20/05/2026-03/06/2026

- https://sgxfx.atlassian.net/browse/BID-20897 | Bank Algo Order Duration preference
	- Add preference: https://github.com/sgx-fx-bidfx/preference-service/pull/266
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/154
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1332
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/688
- https://sgxfx.atlassian.net/browse/BID-46162 | Bank Algo Bank-Specified Order Duration
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/156
	- Upgrade: https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/244
	- Upgrade: https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/689
	- Upgrade: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1337
- https://sgxfx.atlassian.net/browse/BID-45470 | Migration, Cash Ticket, E2E
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2055
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3954
- https://sgxfx.atlassian.net/browse/BID-45450 | Migration, Cash Ticket, E2E
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/2083
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3956

# Quick T-Plan Sprint 7
> 06/05/2026-20/05/2026

*Note: bank holiday, ill for two days*

- https://sgxfx.atlassian.net/browse/BID-46188 | Submit Quick T-plan
	- FF: https://github.com/sgx-fx-ops/terraform-feature-flags/pull/457
	- API: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1312
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1313
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1320
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1327
- Bugfix with quick order submissions found while doing above ticket
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1314
- https://sgxfx.atlassian.net/browse/BID-46189 | Create Quick T-Plan (communicate w/ T-plan)
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1316
- Split tickets & blotters, finally
	- https://github.com/sgx-fx-ops/terraform-github/pull/360
- https://sgxfx.atlassian.net/browse/BID-45613 | Quick T-Plan MFX Validation
	- https://github.com/sgx-fx-bidfx/client-consts-types/pull/147
	- https://github.com/sgx-fx-bidfx/client-multi-fx/pull/2277

# Quick T-Plan Sprint 6
> 22/04/2026-05/05/2026

- https://sgxfx.atlassian.net/browse/BID-45614 | Quick T-Plan In The Money (FX ticket)
	- API: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1299
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1302
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1308
- https://sgxfx.atlassian.net/browse/BID-45923 | Quick T-Plan In The Money, OR group
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1303/
- https://sgxfx.atlassian.net/browse/BID-45921 | Quick T-Plan In The Money (MFX)
	- API: https://sgxfx.atlassian.net/wiki/spaces/BID/pages/1594422556/MultiFX+v2+Workspace+Migration+API
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1309
# Quick T-Plan Sprint 5
> 09/04/2026-21/04/2026

- https://sgxfx.atlassian.net/browse/BID-46139 | Disable quick t-plan when multi-legged deal type
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1289/
- https://sgxfx.atlassian.net/browse/BID-45615 | Quick T-plan trade directions
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1290
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1292
- NOJIRA: consistency in API examples
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1291
- New itest for disabling components when multi-legged
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1294
- https://sgxfx.atlassian.net/browse/BID-45785 | Preferences cash-ticket tech debt
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/680
- https://sgxfx.atlassian.net/browse/BIZ-12899 | Dev escalation
	- Imran and I paired on it
	- Was intended behaviour (BPS preference chosen over PIPS, user set PIPS but system was using branch-wide BPS preference)
# Quick T-Plan Sprint 4
>26/03/2026-08/04/2026

- https://sgxfx.atlassian.net/browse/BID-46037 | Cash Ticket NPE
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/677
	- https://console.cloud.google.com/errors/detail/CPyWk6OHvJLLfA;locations=global;time=P30D?project=bidfx-uatprod
- https://sgxfx.atlassian.net/browse/BID-45469 | Test migration (cash, E2E)
	- Test 59 - https://sgxfx.atlassian.net/wiki/spaces/BID/pages/1594439060/Cash+Openfin
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1816
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3914
- https://sgxfx.atlassian.net/browse/BID-45609 | Editable Quick T-Plan fields
	- API: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1282, https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1285
	- Add `id` fields: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1283
	- Implement PATCH: https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1287

# Quick T-Plan Sprint 3
>12/03/2026-25/03/2026

*3-day holiday*

- https://sgxfx.atlassian.net/browse/BID-45816 | TSS MPI
	- Cause: resource exhaustion in TSS due to redis and threading
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1269
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1270
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1733
- https://sgxfx.atlassian.net/browse/BID-45832 | QT-11a: fields in quick t-plan entry
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1273
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1274/
- https://sgxfx.atlassian.net/browse/BID-45404 | Test migration (cash, E2E)
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1739
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3902
- https://sgxfx.atlassian.net/browse/BID-45607 | QT-11b: pre-populate entry fields
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1278
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1280

## Quick T-Plan Sprint 2
> 25/02/2026-12/03/2026

- https://sgxfx.atlassian.net/browse/BID-45677 | Click-trade tech debt
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1255
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1256
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1257
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1258
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1260
- https://sgxfx.atlassian.net/browse/BID-45603 | Quick T-Plan template on ticket
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1261
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1262
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1266
- Action TODO in qa-acceptance tests
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1691
- https://sgxfx.atlassian.net/jira/software/c/projects/BID/boards/3023 | Quick T-Plan config changes
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1267
- Testing QT-09
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1699
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1702/
- Upgraded deprecated nagios alerter in `example-rep`
	- https://github.com/sgx-fx-bidfx/example-rep/pull/141
## Quick T-Plan Sprint 1
> 11/02/2026-25/02/2026

*5-day holiday*

- https://github.com/sgx-fx-ops/ci-config/pull/235
- https://sgxfx.atlassian.net/browse/BID-45557 | Bug: TSS redis thread getting stuck
	- https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/138
	- Created dev notes
- https://sgxfx.atlassian.net/browse/BID-45575 | Click-trade: add Quick T-Plan component
	- Imran started, I finished
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1249/
- https://sgxfx.atlassian.net/browse/BID-45682
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1665

## Interim (Sprint 8)
> 04/02/2026-11/02/2025

*Interim 1-week sprint between finishing Venue Management and starting Quick T-Plan*

- https://sgxfx.atlassian.net/browse/BID-42665 | Migrate `FXTicketMandatoryFields` tests
	- https://github.com/sgx-fx-bidfx/strategy-engine-algos/pull/232
	- https://github.com/sgx-fx-bidfx/bank-algo-parser/pull/148/
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1238
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3850
- https://sgxfx.atlassian.net/browse/BID-45457 | Migrate `CashTicketMandatoryFields` tests
	- Covered by above ^ (except the `qa-client` and `click-trade` PRs)
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/670
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3851
- https://sgxfx.atlassian.net/browse/BID-45431 | Test migration (BE)
	- `cash.preferences.BlockTradingFromDepth`
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3854
- https://sgxfx.atlassian.net/browse/BID-45405 | Test migration (E2E)
	- `cash.risk.RiskRFQSpot`
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1603
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3856
- https://sgxfx.atlassian.net/browse/BID-45519 | Test migration (BE)
	- `cash.CashTicketLadderComponent`
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/671#
- https://sgxfx.atlassian.net/browse/BID-45428 | Test migration (BE)
	- `cash.strategy.StrategyTWAPMinimumQuantities`
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1242
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3858
- https://sgxfx.atlassian.net/browse/BID-45448 | Test migration (E2E)
	- `cash.AmendBenchmarkOrderQuantityBeforeExecution`
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1608
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3859
- https://sgxfx.atlassian.net/browse/BID-45429 | Test migration (E2E)
	- `cash.pricing.RFQPricingLMIntegration`
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1610
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3861

## Sprint 7
> 21/01/2026-04/02/2026

- Venue management: new schemas to UAT and PROD
	- UAT: https://sgxfx.atlassian.net/browse/CR-31979
	- PROD: https://sgxfx.atlassian.net/browse/CR-31980
- Click-trade: VM-14
	- https://github.com/sgx-fx-bidfx/venue-management/pull/65
- https://sgxfx.atlassian.net/browse/BID-45321 | Click trade: avoid repeated building of ticket
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1224
- https://sgxfx.atlassian.net/browse/BID-45327 | Ticket storage service: support GCP alerts
	- https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/136
	- https://github.com/sgx-fx-ops/k8s-gitops-dev/pull/2420
- DEVESC: NPE in tab header bar updater handler
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1227
- https://sgxfx.atlassian.net/browse/BID-45346 | Click-trade: VM-14b
	- Confusion with Imran, basically he did VM-14b while I did VM-14 AC2.
- https://sgxfx.atlassian.net/browse/BID-45275 | Venue-management: VM-14c
	- Investigated, talked with Nick, then Nick & Ronan, then Adam - unnecessary due to distributed system and healthiness of pods and regions
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1231
- https://sgxfx.atlassian.net/browse/BID-45360 | Click-trade: bug: Leaking user-specific TabManager into 'global' (REP) TicketValidator
	- Summary: `mTicketValidator.setTabManager(tabManager)` - setting user-specific object on REP-level object.
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1230
- Fix failing Cash Openfin test
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3841
## Sprint 6
> 7/01/2026-21/01/2026

Not much work to do besides helping others, also had TDD training and took a day off for an appointment,
- Spike for endpoint testing
	- https://github.com/sgx-fx-bidfx/venue-management/pull/63
- Maintenance - code cleanup
	- https://github.com/sgx-fx-bidfx/trade-rep/pull/372

## Sprint 5
> 17/12/2025-7/01/2026

*Note* three-week sprint; BE took a lot of holiday
- https://sgxfx.atlassian.net/browse/BID-44993 | Venue management: tech debt
	- https://github.com/sgx-fx-bidfx/venue-management/pull/52
	- https://github.com/sgx-fx-bidfx/venue-management/pull/61
	- Autoscaling normalisation:
		- https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/15026
		- https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/15028
- https://sgxfx.atlassian.net/browse/BID-45016 | Venue management: add field names to validation failure responses
	- https://github.com/sgx-fx-bidfx/venue-management/pull/53
- https://sgxfx.atlassian.net/browse/BID-45043 | Venue management: modify `GET /users` endpoint
	- https://github.com/sgx-fx-bidfx/venue-management/pull/54
	- Bugfix: https://github.com/sgx-fx-bidfx/venue-management/tree/bugfix/BID-44808-fix-user-cget
- https://sgxfx.atlassian.net/browse/BID-45090 | Venue management: set up privileged users
	- https://github.com/sgx-fx-bidfx/venue-management/pull/57
- Gitops dev: typo in Sesame account name `fxveuenmgt`
	- https://github.com/sgx-fx-ops/k8s-gitops-dev/pull/2391
- Venue management: clean-up imports
	- https://github.com/sgx-fx-bidfx/venue-management/pull/59
- https://sgxfx.atlassian.net/browse/CR-29965 | Venue management to prod
	- https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13760
	- https://github.com/sgx-fx-ops/terraform-gcp/pull/3602
- Investigate qa bug: fx ticket
	- https://github.com/sgx-fx-bidfx/qa-acceptance-tests/pull/1465
## Sprint 4
> 4/12/2025-17/12/2025

*Note* took two days off
- https://sgxfx.atlassian.net/browse/BID-44806 | Venue management: delete a venue plan
	- https://github.com/sgx-fx-bidfx/venue-management/pull/45
	- Permissioning CRs
		- https://sgxfx.atlassian.net/browse/CR-31111
		- (Included in) https://sgxfx.atlassian.net/browse/CR-30454
- https://sgxfx.atlassian.net/browse/BID-44808 | Venue management: view branch user assignments
	- https://github.com/sgx-fx-bidfx/venue-management/pull/45
	- Required admin-bridge change - https://github.com/sgx-fx-bidfx/admin-bridge/pull/325
- https://sgxfx.atlassian.net/browse/BID-44916 | Venue management: include number of users assigned to the plan on its summary
	- https://github.com/sgx-fx-bidfx/venue-management/pull/47
- Venue management: sorting users assigned to a plan
	- https://github.com/sgx-fx-bidfx/venue-management/pull/49
## Sprint 3
> 14/11/2025 - 27/11/2025
- Deploy venue management to PROD:
	- Same CRs as last sprint, but new PR.
	- https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13760
	- https://sgxfx.atlassian.net/browse/CR-30251
	- ci-config changes to spin-up pods:
		- https://github.com/sgx-fx-ops/ci-config/pull/184
	- Renamed venue management service account
		- https://github.com/sgx-fx-ops/k8s-gitops-dev/pull/2373
- https://sgxfx.atlassian.net/browse/BID-44457 | MFX: Add Off venue to tab header bar dropdown
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1206
- https://sgxfx.atlassian.net/browse/BID-44530 | Rename fields in venue-management
	- https://github.com/sgx-fx-bidfx/venue-management/pull/23
- Venue management: create a new venue plan
	- https://sgxfx.atlassian.net/browse/BID-44517 | Define API for creating a new venue plan
		- https://github.com/sgx-fx-bidfx/venue-management/pull/22
	- https://sgxfx.atlassian.net/browse/BID-44518 | Create venue plan in rep
		- https://github.com/sgx-fx-bidfx/venue-management/pull/25
	- https://sgxfx.atlassian.net/browse/BID-44519 | Create venue plan in service
		- https://github.com/sgx-fx-bidfx/venue-management/pull/26/
	- Add query param `buyside_default` (change request by Ed)
		- https://github.com/sgx-fx-bidfx/venue-management/pull/30
- Venue management: update assigned users on a plan
	- https://sgxfx.atlassian.net/browse/BID-44553 | Define API for updating the assigned users
		- https://github.com/sgx-fx-bidfx/venue-management/pull/27
- Venue management bugfix - add passwords to self-service requests
	- https://github.com/sgx-fx-bidfx/venue-management/pull/35
- Venue management: get venue plan: implement missing 304 response
	- https://sgxfx.atlassian.net/browse/BID-44764
	- https://github.com/sgx-fx-bidfx/venue-management/pull/39
	
## Sprint 2
> 30/10/2025 - 13/11/2025
- (Started) database setup
	- https://github.com/sgx-fx-bidfx/venue-management/pull/10
- Update trade API in qa-client
	- https://github.com/sgx-fx-bidfx/qa-client/pull/3806
- Deploy `venue-management` to PROD
	- https://sgxfx.atlassian.net/browse/BID-44263
	- https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13760
- Added get venue plan to rep
	- https://github.com/sgx-fx-bidfx/venue-management/pull/15
- (Helped with tail end of) Adding get venue summaries on service
	- https://github.com/sgx-fx-bidfx/venue-management/pull/13
- Update "Off" to "OFF" in click-trade and cash-ticket
	- https://sgxfx.atlassian.net/browse/BID-44419
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1205
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/659
## Sprint 1
*Note*: sick for the first half of the sprint
- Upgrade deprecated functions, mainly `getAlerts` $\to$ `getAlerter`.
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/653
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1202/
	- https://github.com/sgx-fx-bidfx/ticket-storage-service/pull/134
- Help set up `venue-management` repo & service
	- https://github.com/sgx-fx-bidfx/venue-management/
- Deploy `venue-management` to UAT
	- https://sgxfx.atlassian.net/browse/BID-44262
	- https://github.com/sgx-fx-ops/terraform-gcp/pull/3344
	- https://github.com/sgx-fx-ops/k8s-gitops-prod/pull/13032

## In-Between
> One week gap period after Tickets & Blotters' team split
- Cash Ticket test fixes
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/646
- https://sgxfx.atlassian.net/browse/BID-40299 | FX Ticket: honouring BV preference
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1198

---
When we were still Tickets & Blotters...
## Sprint 23
- https://sgxfx.atlassian.net/browse/BID-43730 | Position Blotter: Clean up feature flags
	- position-rep : https://github.com/sgx-fx-bidfx/position-rep/pull/120
- https://sgxfx.atlassian.net/browse/BID-43694 | Trade Blotter: Pause single order
	- Add feature flag: https://github.com/sgx-fx-ops/terraform-feature-flags/pull/383
	- cash-om-bridge : https://github.com/sgx-fx-bidfx/cash-om-bridge/pull/492
	- trading-blotter : https://github.com/sgx-fx-ops/terraform-feature-flags/pull/383
- Bug fixes for tab header bar.
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1191
- https://sgxfx.atlassian.net/browse/BID-43731 | Archive: Clean up feature flags
- https://sgxfx.atlassian.net/browse/BID-43695 | Trade Blotter: Pause multiple orders
	- https://github.com/sgx-fx-bidfx/trade-rep/pull/340
- https://sgxfx.atlassian.net/browse/BID-43696 | Cash Ticket: Pause orders
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/642
- https://sgxfx.atlassian.net/browse/BID-27918 | Click Trade: Clean Up Log Noise
	- https://github.com/sgx-fx-bidfx/click-trade-rep/pull/1194

## Sprint 22
- https://sgxfx.atlassian.net/browse/BID-43444 | Multi-FX: header bar venue override
	- 1 sprint and a few days
	- Multiple blockers and work
		- Add regulated venues to user (blocker)
		- Add fields to TicketStorageService (work)
		- Venue config violation (blocker, bug)
		- Venue lock on syncing (bug)
	- Repos
		- click-trade-rep
		- ticket-storage-service

## Sprint 21
- https://sgxfx.atlassian.net/browse/BID-42843 | Cash ticket: add venue component to Cash Ticket
	- https://github.com/sgx-fx-bidfx/cash-ticket-rep/pull/629

[END]