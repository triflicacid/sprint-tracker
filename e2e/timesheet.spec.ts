import { test, expect, type Page } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask, transitionSubtask } from "./seed.js";

// timesheet has two views, both a single freely-navigable month at a time.
// "stories" mode (default, tested at the top level below) shows every story
// worked on each day across all sprints - not scoped to one sprint's date
// range like the stats page's calendar - and doubles as the (global) holiday
// editor except for days in the past. the past/weekend non-toggle rules are
// covered precisely (with a pinned "today") by TimesheetPage's integration
// tests; this spec just proves the happy path (activity display, holiday
// toggle, month nav) works end to end in a real browser.
// "sprints" mode (bottom describe block) is every sprint as a range-line,
// filterable by repo/tag - the former standalone "/calendar" page

// the sprints-mode calendar defaults to today's month - navigate to a fixed
// test-fixture month via the same prev/next chevrons a user would click
/**
 * navigates the sprints-mode calendar to the target utc month
 * @param page playwright page
 * @param target date whose utc month/year should be shown
 */
async function navigateSprintsCalendarToMonth(page: Page, target: Date) {
    const now = new Date();
    const monthDiff = (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + (target.getUTCMonth() - now.getUTCMonth());
    const button = monthDiff < 0 ? "previous month" : "next month";
    for (let i = 0; i < Math.abs(monthDiff); i++) {
        await page.getByRole("button", { name: button }).click();
    }
}

test("nav link on the sprint list page opens the timesheet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "timesheet", exact: true }).click();
    await expect(page).toHaveURL(/\/timesheet$/);
    await expect(page.getByRole("heading", { name: "Timesheet" })).toBeVisible();
});

test("shows a story's activity chip on the day it was worked on, across sprints", async ({ page, request }) => {
    // the stories view hides chips on weekends (nobody's working them), and
    // this test can't control which day the subtask's transition lands on -
    // it's always "now". skip on the rare weekend run rather than assert
    // around it
    test.skip([0, 6].includes(new Date().getUTCDay()), "chips are hidden on weekends - not meaningful to assert here");

    const suffix = Date.now();
    // bounded around "today" - not open-ended, so this sprint's bar doesn't
    // stretch across the fixed 2026-05/2026-11 ranges the "sprints mode"
    // tests below use (this file shares one db across all its tests) - and
    // not a fixed past date either, since a sprint whose endDate has
    // already passed is locked, rejecting the story/subtask creation below
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const sprint = await seedSprint(request, {
        name: `E2E Timesheet ${suffix}`,
        startDate,
        endDate: endDate.toISOString().slice(0, 10),
    });
    const story = await seedStory(request, sprint.id, {
        jiraUrl: `https://example.atlassian.net/browse/TS-${suffix}`,
        description: `e2e timesheet story ${suffix}`,
    });
    const subtask = await seedSubtask(request, story.id, "e2e timesheet subtask");
    await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/timesheet-e2e" });

    await page.goto("/timesheet");

    // the subtask transitioned to WIP "now", so its chip lands on today's cell
    const today = new Date();
    const monthLabel = today.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
    await expect(page.getByText(new RegExp(`^${monthLabel} \\d{4}$`))).toBeVisible();

    const todayCell = page
        .locator(".calendar-day")
        .filter({ has: page.locator(".calendar-day-number", { hasText: new RegExp(`^${today.getUTCDate()}$`) }) });

    // today's cell is shared with every other e2e spec that also transitions
    // a subtask "now" in the same run, so this chip may be folded into
    // "+N more" if there are already MAX_VISIBLE_CHIPS ahead of it - check
    // either the direct chip or the overflow chip's title tooltip
    await todayCell.locator(".calendar-day-activity-chip, .calendar-day-activity-more").first().waitFor();
    // the story-mode chip's visible label is just the story code - branch
    // name only shows up in the hover tooltip
    const storyLabel = `TS-${suffix}`;
    const directChip = todayCell.getByText(storyLabel, { exact: true });
    const overflowChip = todayCell.locator(".calendar-day-activity-more");
    if (await directChip.count()) {
        await expect(directChip).toBeVisible();
    } else {
        const tooltipDetail = `${storyLabel} feature/timesheet-e2e`;
        await expect(overflowChip).toHaveAttribute("title", new RegExp(tooltipDetail.replace("/", "\\/")));
    }
});

test("toggles a holiday on a today-or-future weekday, and navigates months", async ({ page }) => {
    await page.goto("/timesheet");

    // the nearest monday on or after today - always a weekday, and never in
    // the past, regardless of which real day this spec happens to run on
    const today = new Date();
    const daysUntilMonday = (8 - today.getUTCDay()) % 7;
    const target = new Date(today);
    target.setUTCDate(target.getUTCDate() + daysUntilMonday);

    // stays in the current calendar month for all but the last few days of
    // one - good enough odds for this smoke test; the precise past/weekend
    // rules are covered deterministically by TimesheetPage's own tests
    const targetCell = page
        .locator(".calendar-day")
        .filter({ has: page.locator(".calendar-day-number", { hasText: new RegExp(`^${target.getUTCDate()}$`) }) });
    await expect(targetCell).toHaveClass(/calendar-day-active/);
    await targetCell.click();
    await expect(targetCell).toHaveClass(/calendar-day-holiday/);
    // toggle back off so this doesn't leave stray state for other e2e specs
    // sharing this run's db
    await targetCell.click();
    await expect(targetCell).toHaveClass(/calendar-day-active/);

    const currentMonthLabel = today.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
    await page.getByRole("button", { name: "next month" }).click();
    await expect(page.getByText(new RegExp(`^${currentMonthLabel} \\d{4}$`))).not.toBeVisible();

    await page.getByRole("button", { name: "today" }).click();
    await expect(page.getByText(new RegExp(`^${currentMonthLabel} \\d{4}$`))).toBeVisible();
});

// "sprints" mode used to be its own "/calendar" page - these were migrated
// here, unchanged in substance, when that page was folded into the
// timesheet as a second view
test.describe("sprints mode", () => {
    test("renders sprints as range-lines, splitting a shared handoff day in half", async ({ page, request }) => {
        const suffix = Date.now();
        const sprintA = await seedSprint(request, {
            name: `E2E Range A ${suffix}`,
            startDate: "2026-05-01",
            endDate: "2026-05-15",
        });
        await seedSprint(request, {
            name: `E2E Range B ${suffix}`,
            startDate: "2026-05-15",
            endDate: "2026-05-25",
        });

        await page.goto("/timesheet");
        await page.getByRole("button", { name: "sprints" }).click();
        await navigateSprintsCalendarToMonth(page, new Date(Date.UTC(2026, 4, 1)));
        await expect(page.getByText("May 2026")).toBeVisible();

        const barA = page.locator(".range-bar", { hasText: `E2E Range A ${suffix}` }).first();
        const barB = page.locator(".range-bar", { hasText: `E2E Range B ${suffix}` }).first();
        await expect(barA).toBeVisible();
        await expect(barB).toBeVisible();

        // both sprints touch on 05-15 - they should still share a single lane
        // row (not stack), each bar's grid-column meeting at the same
        // boundary. checks that one lane contains both bars, rather than
        // counting total lanes in the week - other e2e specs seed
        // open-ended sprints elsewhere that may also land a lane in this
        // same week, which isn't what this assertion cares about.
        // only one month is rendered at a time, so day "15" is unambiguous here
        const week = page
            .locator(".range-week", { has: page.locator(".range-day-number", { hasText: /^15$/ }) })
            .first();
        const sharedLane = week
            .locator(".range-lane")
            .filter({ has: page.locator(".range-bar", { hasText: `E2E Range A ${suffix}` }) })
            .filter({ has: page.locator(".range-bar", { hasText: `E2E Range B ${suffix}` }) });
        await expect(sharedLane).toHaveCount(1);

        await barA.click();
        await expect(page).toHaveURL(new RegExp(`/sprints/${sprintA.id}$`));
    });

    test("toggles a holiday on a today-or-future weekday via its day number", async ({ page, request }) => {
        const suffix = Date.now();
        // bounded around "today" so the calendar's rendered range definitely
        // covers the target day picked below, and the sprint stays unlocked
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14);
        await seedSprint(request, {
            name: `E2E Holiday Toggle ${suffix}`,
            startDate,
            endDate: endDate.toISOString().slice(0, 10),
        });

        await page.goto("/timesheet");
        await page.getByRole("button", { name: "sprints" }).click();

        // the nearest monday on or after today - always a weekday, and never
        // in the past, regardless of which real day this spec happens to run on
        const today = new Date();
        const daysUntilMonday = (8 - today.getUTCDay()) % 7;
        const target = new Date(today);
        target.setUTCDate(target.getUTCDate() + daysUntilMonday);
        const monthLabel = target.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

        await navigateSprintsCalendarToMonth(page, target);
        await expect(page.getByText(monthLabel)).toBeVisible();

        // excludes muted day numbers - a trailing/leading pad day shared with
        // a neighbouring month can coincidentally show the same digit
        const day = page
            .locator(".range-day-number:not(.range-day-number-muted)", {
                hasText: new RegExp(`^${target.getUTCDate()}$`),
            })
            .first();
        await expect(day).not.toHaveClass(/range-day-number-holiday/);
        await day.click();
        await expect(day).toHaveClass(/range-day-number-holiday/);
        // toggle back off so this doesn't leave stray state for other e2e
        // specs sharing this run's db
        await day.click();
        await expect(day).not.toHaveClass(/range-day-number-holiday/);
    });

    // repo filter is auto-derived from a subtask's pr url (custom tags are
    // hand-added - see story-tags.spec.ts). fixed, non-overlapping range keeps
    // this sprint out of other specs' lanes, which would change the
    // range-lane count the test above asserts
    test("repo filter narrows sprints down to ones with a matching repo tag", async ({ page, request }) => {
        const suffix = Date.now();
        const repoName = `e2e-filter-repo-${suffix}`;
        const otherRepoName = `e2e-other-repo-${suffix}`;

        const sprint = await seedSprint(request, {
            name: `E2E Filter ${suffix}`,
            startDate: "2026-11-02",
            endDate: "2026-11-13",
        });
        const story = await seedStory(request, sprint.id, { description: `e2e filter story ${suffix}` });
        const subtask = await seedSubtask(request, story.id, "e2e filter subtask");
        await transitionSubtask(request, subtask.id, { status: "WIP", branchName: "feature/e2e-filter" });
        await transitionSubtask(request, subtask.id, {
            status: "IN_PR",
            prUrl: `https://github.com/example/${repoName}/pull/1`,
        });

        // second sprint tagged with a different repo, just so `otherRepoName`
        // is a real dropdown option - proves exclusion, not a missing option
        const otherSprint = await seedSprint(request, {
            name: `E2E Filter Other ${suffix}`,
            startDate: "2026-11-16",
            endDate: "2026-11-27",
        });
        const otherStory = await seedStory(request, otherSprint.id, { description: `e2e other filter story ${suffix}` });
        const otherSubtask = await seedSubtask(request, otherStory.id, "e2e other filter subtask");
        await transitionSubtask(request, otherSubtask.id, { status: "WIP", branchName: "feature/e2e-other-filter" });
        await transitionSubtask(request, otherSubtask.id, {
            status: "IN_PR",
            prUrl: `https://github.com/example/${otherRepoName}/pull/1`,
        });

        await page.goto("/timesheet");
        await page.getByRole("button", { name: "sprints" }).click();
        await navigateSprintsCalendarToMonth(page, new Date(Date.UTC(2026, 10, 1)));
        await expect(page.getByText("November 2026")).toBeVisible();

        const bar = page.locator(".range-bar", { hasText: `E2E Filter ${suffix}` }).first();
        await expect(bar).toBeVisible();

        const repoFilter = page.locator("label.tag-filter", { hasText: "repo" }).locator("select");
        await repoFilter.selectOption(repoName);
        await expect(bar).toBeVisible();

        // this sprint's story was never tagged with the other repo, so it must
        // drop out of view once the filter switches to it
        await repoFilter.selectOption(otherRepoName);
        await expect(bar).toHaveCount(0);

        await repoFilter.selectOption("");
        await expect(bar).toBeVisible();
    });
});
