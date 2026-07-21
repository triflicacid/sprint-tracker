import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollapsibleSection, CollapseAllContext, ExpandAllContext } from "./CollapsibleSection";

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

    describe("CollapseAllContext", () => {
        function CollapseAllHarness({ signal }: { signal: number }) {
            return (
                <CollapseAllContext.Provider value={signal}>
                    <CollapsibleSection title="sprints">body content</CollapsibleSection>
                </CollapseAllContext.Provider>
            );
        }

        it("collapses when the context signal increments", async () => {
            const { rerender } = render(<CollapseAllHarness signal={0} />);
            expect(screen.getByText("body content")).toBeInTheDocument();
            rerender(<CollapseAllHarness signal={1} />);
            expect(screen.queryByText("body content")).toBeNull();
            expect(document.querySelector("hr.section-collapsed-rule")).toBeInTheDocument();
        });

        it("can be re-opened individually after a collapse-all signal", async () => {
            const { rerender } = render(<CollapseAllHarness signal={0} />);
            rerender(<CollapseAllHarness signal={1} />);
            await userEvent.click(screen.getByRole("button", { name: /sprints/i }));
            expect(screen.getByText("body content")).toBeInTheDocument();
        });

        it("does not collapse on initial render with a non-zero signal", () => {
            // signal starts at 1 (e.g. component mounts after a collapse-all was fired)
            // sections should still open by default since they weren't alive for that signal
            render(<CollapseAllHarness signal={1} />);
            expect(screen.getByText("body content")).toBeInTheDocument();
        });
    });

    describe("ExpandAllContext", () => {
        function ExpandAllHarness({ signal }: { signal: number }) {
            return (
                <ExpandAllContext.Provider value={signal}>
                    <CollapsibleSection title="sprints" defaultOpen={false}>body content</CollapsibleSection>
                </ExpandAllContext.Provider>
            );
        }

        it("expands when the context signal increments", async () => {
            const { rerender } = render(<ExpandAllHarness signal={0} />);
            expect(screen.queryByText("body content")).toBeNull();
            rerender(<ExpandAllHarness signal={1} />);
            expect(screen.getByText("body content")).toBeInTheDocument();
        });

        it("can be re-collapsed individually after an expand-all signal", async () => {
            const { rerender } = render(<ExpandAllHarness signal={0} />);
            rerender(<ExpandAllHarness signal={1} />);
            await userEvent.click(screen.getByRole("button", { name: /sprints/i }));
            expect(screen.queryByText("body content")).toBeNull();
        });

        it("does not expand on initial render with a non-zero signal", () => {
            render(<ExpandAllHarness signal={1} />);
            // defaultOpen=false, signal was already 1 on mount — should stay closed
            expect(screen.queryByText("body content")).toBeNull();
        });
    });
});






