import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StoryCard } from "./StoryCard";

const baseStory = {
    id: 1,
    sprintId: 1,
    jiraUrl: "https://nebula.atlassian.net/browse/NEB-1001",
    jiraKey: "NEB-1001",
    description: "support saved cards",
    jiraTitle: null,
    jiraLabels: [],
    status: "WIP" as const,
    awaitingMoreSubtasks: false,
    tags: [{ id: 1, name: "payments", tagType: "custom" as const }],
    prCount: 2,
};

describe("StoryCard", () => {
    it("shows the jira key linking to jira, the status badge, and the description linking to the story", () => {
        render(
            <MemoryRouter>
                <StoryCard story={baseStory} />
            </MemoryRouter>
        );
        const jiraLink = screen.getByText("NEB-1001");
        expect(jiraLink).toHaveAttribute("href", baseStory.jiraUrl);
        expect(screen.getByText("wip")).toBeInTheDocument();

        const storyLink = screen.getByText("support saved cards");
        expect(storyLink).toHaveAttribute("href", "/stories/1");
    });

    it("prefers the jira title over the plain description when present", () => {
        render(
            <MemoryRouter>
                <StoryCard story={{ ...baseStory, jiraTitle: "Support saved payment methods" }} />
            </MemoryRouter>
        );
        expect(screen.getByText("Support saved payment methods")).toBeInTheDocument();
        expect(screen.queryByText("support saved cards")).not.toBeInTheDocument();
    });

    it("falls back to the raw jira url when there is no jira key", () => {
        render(
            <MemoryRouter>
                <StoryCard story={{ ...baseStory, jiraKey: null }} />
            </MemoryRouter>
        );
        expect(screen.getByText(baseStory.jiraUrl)).toBeInTheDocument();
    });

    it("shows the pr count and every tag", () => {
        render(
            <MemoryRouter>
                <StoryCard story={baseStory} />
            </MemoryRouter>
        );
        expect(screen.getByText("2 pull requests")).toBeInTheDocument();
        expect(screen.getByText("payments")).toBeInTheDocument();
    });
});
