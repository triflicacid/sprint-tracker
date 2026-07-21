import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollapsibleSection } from "./CollapsibleSection";

describe("CollapsibleSection", () => {
    it("renders the title and children open by default", () => {
        render(<CollapsibleSection title="sprints">body content</CollapsibleSection>);
        expect(screen.getByText("sprints")).toBeInTheDocument();
        expect(screen.getByText("body content")).toBeInTheDocument();
    });

    it("trigger has aria-expanded=true when open", () => {
        render(<CollapsibleSection title="sprints">body</CollapsibleSection>);
        expect(screen.getByRole("button", { name: /sprints/i })).toHaveAttribute("aria-expanded", "true");
    });

    it("does not show an hr when open", () => {
        const { container } = render(<CollapsibleSection title="sprints">body</CollapsibleSection>);
        expect(container.querySelector("hr.section-collapsed-rule")).toBeNull();
    });

    it("chevron does not have the closed class when open", () => {
        const { container } = render(<CollapsibleSection title="sprints">body</CollapsibleSection>);
        expect(container.querySelector(".collapsible-chevron")).not.toHaveClass("closed");
    });

    it("collapses on click — hides children and shows an hr", async () => {
        render(<CollapsibleSection title="sprints">body content</CollapsibleSection>);
        await userEvent.click(screen.getByRole("button", { name: /sprints/i }));
        expect(screen.queryByText("body content")).toBeNull();
        expect(document.querySelector("hr.section-collapsed-rule")).toBeInTheDocument();
    });

    it("trigger has aria-expanded=false when collapsed", async () => {
        render(<CollapsibleSection title="sprints">body</CollapsibleSection>);
        await userEvent.click(screen.getByRole("button", { name: /sprints/i }));
        expect(screen.getByRole("button", { name: /sprints/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("chevron has the closed class when collapsed", async () => {
        const { container } = render(<CollapsibleSection title="sprints">body</CollapsibleSection>);
        await userEvent.click(screen.getByRole("button", { name: /sprints/i }));
        expect(container.querySelector(".collapsible-chevron")).toHaveClass("closed");
    });

    it("re-expands on a second click", async () => {
        render(<CollapsibleSection title="sprints">body content</CollapsibleSection>);
        const trigger = screen.getByRole("button", { name: /sprints/i });
        await userEvent.click(trigger);
        await userEvent.click(trigger);
        expect(screen.getByText("body content")).toBeInTheDocument();
        expect(document.querySelector("hr.section-collapsed-rule")).toBeNull();
    });

    it("starts collapsed when defaultOpen is false", () => {
        render(
            <CollapsibleSection title="sprints" defaultOpen={false}>
                body content
            </CollapsibleSection>
        );
        expect(screen.queryByText("body content")).toBeNull();
        expect(document.querySelector("hr.section-collapsed-rule")).toBeInTheDocument();
    });

    it("chevron has the closed class when defaultOpen is false", () => {
        const { container } = render(
            <CollapsibleSection title="sprints" defaultOpen={false}>
                body
            </CollapsibleSection>
        );
        expect(container.querySelector(".collapsible-chevron")).toHaveClass("closed");
    });

    it("renders an h2 heading by default", () => {
        const { container } = render(<CollapsibleSection title="sprints">body</CollapsibleSection>);
        expect(container.querySelector("h2.collapsible-section-heading")).toBeInTheDocument();
    });

    it("renders an h3 heading when headingLevel is h3", () => {
        const { container } = render(
            <CollapsibleSection title="story fields" headingLevel="h3">
                body
            </CollapsibleSection>
        );
        expect(container.querySelector("h3.collapsible-section-heading")).toBeInTheDocument();
    });

    it("renders headerActions alongside the trigger", () => {
        render(
            <CollapsibleSection title="sprints" headerActions={<button>export</button>}>
                body
            </CollapsibleSection>
        );
        // both the trigger and the action button should be present
        expect(screen.getByRole("button", { name: /sprints/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "export" })).toBeInTheDocument();
    });

    it("headerActions remain visible when the section is collapsed", async () => {
        render(
            <CollapsibleSection title="sprints" headerActions={<button>export</button>}>
                body content
            </CollapsibleSection>
        );
        await userEvent.click(screen.getByRole("button", { name: /sprints/i }));
        expect(screen.queryByText("body content")).toBeNull();
        expect(screen.getByRole("button", { name: "export" })).toBeInTheDocument();
    });
});


