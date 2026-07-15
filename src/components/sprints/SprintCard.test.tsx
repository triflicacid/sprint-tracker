import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SprintCard } from "./SprintCard";

describe("SprintCard", () => {
    it("links to the sprint's detail page and shows its date range", () => {
        render(
            <MemoryRouter>
                <SprintCard
                    sprint={{
                        id: 3,
                        name: "Sprint 3",
                        startDate: "2026-03-30",
                        endDate: null,
                        comment: null,
                        storyCount: 2,
                        prCount: 4,
                    }}
                />
            </MemoryRouter>
        );
        expect(screen.getByRole("link")).toHaveAttribute("href", "/sprints/3");
        expect(screen.getByText("Sprint 3")).toBeInTheDocument();
        expect(screen.getByText("30/03/2026 to present")).toBeInTheDocument();
        expect(screen.getByText("2 stories")).toBeInTheDocument();
        expect(screen.getByText("4 pull requests")).toBeInTheDocument();
    });

    it("shows the end date instead of 'present' once the sprint has one", () => {
        render(
            <MemoryRouter>
                <SprintCard
                    sprint={{
                        id: 1,
                        name: "Sprint 1",
                        startDate: "2026-01-01",
                        endDate: "2026-01-15",
                        comment: null,
                        storyCount: 0,
                        prCount: 0,
                    }}
                />
            </MemoryRouter>
        );
        expect(screen.getByText("01/01/2026 to 15/01/2026")).toBeInTheDocument();
    });

    it("shows the comment only when present", () => {
        const { rerender } = render(
            <MemoryRouter>
                <SprintCard
                    sprint={{
                        id: 1,
                        name: "Sprint 1",
                        startDate: "2026-01-01",
                        endDate: null,
                        comment: "1-day holiday",
                        storyCount: 0,
                        prCount: 0,
                    }}
                />
            </MemoryRouter>
        );
        expect(screen.getByText("1-day holiday")).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <SprintCard
                    sprint={{
                        id: 1,
                        name: "Sprint 1",
                        startDate: "2026-01-01",
                        endDate: null,
                        comment: null,
                        storyCount: 0,
                        prCount: 0,
                    }}
                />
            </MemoryRouter>
        );
        expect(screen.queryByText("1-day holiday")).not.toBeInTheDocument();
    });
});
