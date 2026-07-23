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
                        project: null,
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
                        project: null,
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
                        project: null,
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
                        project: null,
                        storyCount: 0,
                        prCount: 0,
                    }}
                />
            </MemoryRouter>
        );
        expect(screen.queryByText("1-day holiday")).not.toBeInTheDocument();
    });

    it("shows the project tag when present", () => {
        render(
            <MemoryRouter>
                <SprintCard
                    sprint={{
                        id: 5,
                        name: "Sprint 5",
                        startDate: "2026-05-01",
                        endDate: null,
                        comment: null,
                        project: "Nebula Checkout Platform",
                        storyCount: 3,
                        prCount: 1,
                    }}
                />
            </MemoryRouter>
        );
        expect(screen.getByText("Nebula Checkout Platform")).toBeInTheDocument();
        expect(screen.getByText("Nebula Checkout Platform")).toHaveClass("project-tag");
    });

    it("does not show the project tag when not present", () => {
        render(
            <MemoryRouter>
                <SprintCard
                    sprint={{
                        id: 6,
                        name: "Sprint 6",
                        startDate: "2026-06-01",
                        endDate: null,
                        comment: null,
                        project: null,
                        storyCount: 1,
                        prCount: 0,
                    }}
                />
            </MemoryRouter>
        );
        expect(document.querySelector(".project-tag")).not.toBeInTheDocument();
    });
});
