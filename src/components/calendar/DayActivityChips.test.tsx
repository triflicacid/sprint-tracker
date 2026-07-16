import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { DayActivityEntry } from "@shared/types";
import { DayActivityChips } from "./DayActivityChips";

describe("DayActivityChips", () => {
    it("renders nothing for an empty activity list", () => {
        const { container } = render(<DayActivityChips activities={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("shows a chip per activity entry", () => {
        const activities: DayActivityEntry[] = [
            { storyId: 1, storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null },
        ];
        render(<DayActivityChips activities={activities} />);
        expect(screen.getByText("NEB-1 feature/x")).toBeInTheDocument();
    });

    it("renders a pr-linked chip as a link", () => {
        const activities: DayActivityEntry[] = [
            {
                storyId: 1,
                storyLabel: "NEB-1",
                branchName: "feature/x",
                status: "WIP",
                prUrl: "https://github.com/org/repo/pull/1",
            },
        ];
        render(<DayActivityChips activities={activities} />);
        const chip = screen.getByText("NEB-1 feature/x");
        expect(chip.tagName).toBe("A");
        expect(chip).toHaveAttribute("href", "https://github.com/org/repo/pull/1");
    });

    it("caps visible chips at 4 (pr mode) and folds the rest into a '+N more' chip", () => {
        const activities: DayActivityEntry[] = [
            { storyId: 1, storyLabel: "A", branchName: "a", status: "WIP", prUrl: null },
            { storyId: 2, storyLabel: "B", branchName: "b", status: "WIP", prUrl: null },
            { storyId: 3, storyLabel: "C", branchName: "c", status: "WIP", prUrl: null },
            { storyId: 4, storyLabel: "D", branchName: "d", status: "WIP", prUrl: null },
            { storyId: 5, storyLabel: "E", branchName: "e", status: "WIP", prUrl: null },
        ];
        render(<DayActivityChips activities={activities} />);
        expect(screen.getByText("+1 more")).toBeInTheDocument();
        expect(screen.queryByText("E e")).not.toBeInTheDocument();
    });

    it("stops a chip click from bubbling to a clickable parent", async () => {
        const activities: DayActivityEntry[] = [
            { storyId: 1, storyLabel: "NEB-1", branchName: "feature/x", status: "WIP", prUrl: null },
        ];
        const onParentClick = vi.fn();
        render(
            <div onClick={onParentClick}>
                <DayActivityChips activities={activities} />
            </div>
        );
        await userEvent.click(screen.getByText("NEB-1 feature/x"));
        expect(onParentClick).not.toHaveBeenCalled();
    });

    describe("linkMode='story'", () => {
        it("links every chip to its story's detail page, even one with a pr url", () => {
            const activities: DayActivityEntry[] = [
                {
                    storyId: 42,
                    storyLabel: "NEB-1",
                    branchName: "feature/x",
                    status: "WIP",
                    prUrl: "https://github.com/org/repo/pull/1",
                },
            ];
            render(
                <MemoryRouter>
                    <DayActivityChips activities={activities} linkMode="story" />
                </MemoryRouter>
            );
            const chip = screen.getByText("NEB-1");
            expect(chip.tagName).toBe("A");
            expect(chip).toHaveAttribute("href", "/stories/42");
        });

        it("lays chips out in a wrapping row, since story codes are short", () => {
            const activities: DayActivityEntry[] = [
                { storyId: 1, storyLabel: "A", branchName: "a", status: "WIP", prUrl: null },
            ];
            const { container } = render(
                <MemoryRouter>
                    <DayActivityChips activities={activities} linkMode="story" />
                </MemoryRouter>
            );
            expect(container.querySelector(".calendar-day-activity")).toHaveClass("calendar-day-activity-wrap");
        });

        it("caps visible chips at 8, higher than pr mode, before folding into '+N more'", () => {
            const activities: DayActivityEntry[] = Array.from({ length: 9 }, (_, i) => ({
                storyId: i,
                storyLabel: String.fromCharCode(65 + i),
                branchName: `branch-${i}`,
                status: "WIP" as const,
                prUrl: null,
            }));
            render(
                <MemoryRouter>
                    <DayActivityChips activities={activities} linkMode="story" />
                </MemoryRouter>
            );
            expect(screen.getByText("+1 more")).toBeInTheDocument();
            expect(screen.getAllByText(/^[A-H]$/)).toHaveLength(8);
            expect(screen.queryByText("I")).not.toBeInTheDocument();
        });
    });
});
