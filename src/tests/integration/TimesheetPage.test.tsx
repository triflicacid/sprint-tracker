import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { DayActivityMap } from "@shared/types";
import { TimesheetPage } from "../../pages/TimesheetPage";

vi.mock("../../api/client", () => ({
    api: {
        getAllDayActivity: vi.fn(),
        listHolidays: vi.fn(),
        addHoliday: vi.fn(),
        removeHoliday: vi.fn(),
        listTags: vi.fn(),
        getCalendar: vi.fn(),
    },
}));

import { api } from "../../api/client";

// "today" pinned to 2026-03-10 (tuesday) so past/future/weekend assertions
// below stay correct regardless of when the suite actually runs.
const TODAY = "2026-03-10T12:00:00Z";

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(TODAY));
    Object.values(api).forEach((fn) => vi.mocked(fn).mockReset());
    vi.mocked(api.getAllDayActivity).mockResolvedValue({});
    vi.mocked(api.listHolidays).mockResolvedValue([]);
    vi.mocked(api.listTags).mockResolvedValue([]);
    vi.mocked(api.getCalendar).mockResolvedValue([]);
});

afterEach(() => {
    vi.useRealTimers();
});

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/timesheet"]}>
            <Routes>
                <Route path="/timesheet" element={<TimesheetPage />} />
                <Route path="/stories/:id" element={<div>story detail page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("TimesheetPage", () => {
    it("opens in stories mode by default", async () => {
        renderPage();
        expect(await screen.findByText("March 2026")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "stories" })).toHaveClass("active");
    });

    describe("stories mode", () => {
        it("fetches all-time activity plus the visible month's holidays", async () => {
            renderPage();
            await screen.findByText("March 2026");
            expect(api.getAllDayActivity).toHaveBeenCalledOnce();
            expect(api.listHolidays).toHaveBeenCalledWith("2026-03-01", "2026-03-31");
        });

        it("shows an activity chip for a day with recorded work, linking to the story", async () => {
            const dayActivity: DayActivityMap = {
                "2026-03-05": [
                    { storyId: 7, storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null },
                ],
            };
            vi.mocked(api.getAllDayActivity).mockResolvedValue(dayActivity);
            renderPage();
            await screen.findByText("March 2026");

            const chip = await screen.findByText("NEB-1");
            expect(chip.tagName).toBe("A");
            expect(chip).toHaveAttribute("href", "/stories/7");
        });

        it("collapses multiple subtasks on the same story that day into one chip", async () => {
            const dayActivity: DayActivityMap = {
                "2026-03-05": [
                    { storyId: 7, storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null },
                    { storyId: 7, storyLabel: "NEB-1", branchName: "feature/y", status: "IN_REVIEW", prUrl: null },
                ],
            };
            vi.mocked(api.getAllDayActivity).mockResolvedValue(dayActivity);
            renderPage();
            await screen.findByText("March 2026");

            expect(await screen.findAllByText("NEB-1")).toHaveLength(1);
        });

        it("hides activity chips on a weekend day even if work was recorded", async () => {
            const dayActivity: DayActivityMap = {
                // 2026-03-07 is a saturday.
                "2026-03-07": [
                    { storyId: 7, storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null },
                ],
            };
            vi.mocked(api.getAllDayActivity).mockResolvedValue(dayActivity);
            renderPage();
            await screen.findByText("March 2026");

            expect(screen.queryByText("NEB-1")).not.toBeInTheDocument();
        });

        it("toggles a holiday on today", async () => {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderPage();
            await screen.findByText("March 2026");

            await userEvent.click(screen.getByText("10", { selector: ".calendar-day-number" }));

            expect(api.addHoliday).toHaveBeenCalledWith("2026-03-10");
        });

        it("toggles a holiday on a future day", async () => {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderPage();
            await screen.findByText("March 2026");

            // 2026-03-11 is a wednesday, after "today" (2026-03-10).
            await userEvent.click(screen.getByText("11", { selector: ".calendar-day-number" }));

            expect(api.addHoliday).toHaveBeenCalledWith("2026-03-11");
        });

        it("does not allow toggling a day in the past", async () => {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderPage();
            await screen.findByText("March 2026");

            // 2026-03-09 is a monday, before "today" (2026-03-10).
            const day = screen
                .getByText("9", { selector: ".calendar-day-number" })
                .closest(".calendar-day") as HTMLElement;
            expect(day).not.toHaveClass("calendar-day-clickable");
            expect(day).not.toHaveAttribute("title");
            await userEvent.click(day);

            expect(api.addHoliday).not.toHaveBeenCalled();
        });

        it("does not allow toggling a weekend day", async () => {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderPage();
            await screen.findByText("March 2026");

            // 2026-03-14 is a saturday, in the future.
            const day = screen
                .getByText("14", { selector: ".calendar-day-number" })
                .closest(".calendar-day") as HTMLElement;
            expect(day).not.toHaveClass("calendar-day-clickable");
            await userEvent.click(day);

            expect(api.addHoliday).not.toHaveBeenCalled();
        });

        it("removes an existing holiday on toggle", async () => {
            vi.mocked(api.listHolidays).mockResolvedValue(["2026-03-11"]);
            vi.mocked(api.removeHoliday).mockResolvedValue(undefined);
            renderPage();
            await screen.findByText("March 2026");

            const day = await screen.findByText("11", { selector: ".calendar-day-number" });
            await userEvent.click(day.closest(".calendar-day") as HTMLElement);

            expect(api.removeHoliday).toHaveBeenCalledWith("2026-03-11");
        });

        it("navigates months and refetches holidays for the newly visible month", async () => {
            renderPage();
            await screen.findByText("March 2026");

            await userEvent.click(screen.getByRole("button", { name: "next month" }));
            expect(await screen.findByText("April 2026")).toBeInTheDocument();
            expect(api.listHolidays).toHaveBeenCalledWith("2026-04-01", "2026-04-30");

            await userEvent.click(screen.getByRole("button", { name: "previous month" }));
            await userEvent.click(screen.getByRole("button", { name: "previous month" }));
            expect(await screen.findByText("February 2026")).toBeInTheDocument();
            expect(api.listHolidays).toHaveBeenCalledWith("2026-02-01", "2026-02-28");
        });

        it("jumps back to the current month via the 'today' button", async () => {
            renderPage();
            await screen.findByText("March 2026");

            await userEvent.click(screen.getByRole("button", { name: "next month" }));
            await screen.findByText("April 2026");

            await userEvent.click(screen.getByRole("button", { name: "today" }));
            expect(await screen.findByText("March 2026")).toBeInTheDocument();
        });
    });

    describe("sprints mode", () => {
        function renderInSprintsMode() {
            const utils = renderPage();
            return utils;
        }

        beforeEach(() => {
            vi.mocked(api.listTags).mockResolvedValue([
                { id: 1, name: "checkout-web", tagType: "repo" },
                { id: 2, name: "urgent", tagType: "custom" },
            ]);
            vi.mocked(api.getCalendar).mockResolvedValue([
                {
                    sprintId: 1,
                    sprintName: "Sprint 1",
                    startDate: "2026-03-02",
                    endDate: "2026-03-16",
                    repos: ["checkout-web"],
                    tags: [],
                },
            ]);
        });

        async function switchToSprintsMode() {
            await userEvent.click(screen.getByRole("button", { name: "sprints" }));
        }

        it("renders the range calendar with entries from the api", async () => {
            renderInSprintsMode();
            await switchToSprintsMode();
            // the sprint's name repeats at the start of every week row it spans
            expect((await screen.findAllByText("Sprint 1")).length).toBeGreaterThan(0);
        });

        it("splits tags into repo and custom filter dropdowns", async () => {
            renderInSprintsMode();
            await switchToSprintsMode();
            expect(await screen.findByText("repo")).toBeInTheDocument();
            expect(screen.getByText("tag")).toBeInTheDocument();
            expect(screen.getByRole("option", { name: "checkout-web" })).toBeInTheDocument();
            expect(screen.getByRole("option", { name: "urgent" })).toBeInTheDocument();
        });

        it("refetches the calendar with the repo filter when changed", async () => {
            renderInSprintsMode();
            await switchToSprintsMode();
            await screen.findAllByText("Sprint 1");
            const [repoSelect] = screen.getAllByRole("combobox");
            await userEvent.selectOptions(repoSelect, "checkout-web");
            expect(api.getCalendar).toHaveBeenCalledWith({ repo: "checkout-web", tag: undefined });
        });

        it("switches back to stories mode", async () => {
            renderInSprintsMode();
            await switchToSprintsMode();
            await screen.findAllByText("Sprint 1");

            await userEvent.click(screen.getByRole("button", { name: "stories" }));
            expect(await screen.findByText("March 2026")).toBeInTheDocument();
        });

        it("fetches holidays for the calendar's full displayed range", async () => {
            renderInSprintsMode();
            await switchToSprintsMode();
            await screen.findAllByText("Sprint 1");
            expect(api.listHolidays).toHaveBeenCalledWith("2026-03-02", "2026-03-16");
        });

        it("toggles a today-or-future weekday's holiday state via the day number", async () => {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderInSprintsMode();
            await switchToSprintsMode();
            await screen.findAllByText("Sprint 1");

            // 2026-03-11 is a wednesday, after "today" (2026-03-10).
            const day = await screen.findByText("11", { selector: ".range-day-number" });
            await userEvent.click(day);
            expect(api.addHoliday).toHaveBeenCalledWith("2026-03-11");
        });

        it("removes an existing holiday when its day number is clicked again", async () => {
            vi.mocked(api.listHolidays).mockResolvedValue(["2026-03-11"]);
            vi.mocked(api.removeHoliday).mockResolvedValue(undefined);
            renderInSprintsMode();
            await switchToSprintsMode();
            await screen.findAllByText("Sprint 1");

            const day = await screen.findByText("11", { selector: ".range-day-number" });
            expect(day).toHaveClass("range-day-number-holiday");
            await userEvent.click(day);
            expect(api.removeHoliday).toHaveBeenCalledWith("2026-03-11");
        });

        it("does not allow toggling a day in the past", async () => {
            vi.mocked(api.addHoliday).mockResolvedValue(undefined);
            renderInSprintsMode();
            await switchToSprintsMode();
            await screen.findAllByText("Sprint 1");

            // 2026-03-09 is a monday, before "today" (2026-03-10).
            const day = await screen.findByText("9", { selector: ".range-day-number" });
            expect(day).not.toHaveClass("range-day-number-clickable");
            await userEvent.click(day);
            expect(api.addHoliday).not.toHaveBeenCalled();
        });
    });
});
