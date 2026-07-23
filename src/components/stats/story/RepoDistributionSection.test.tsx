import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { SprintStats } from "@shared/types";
import { RepoDistributionSection } from "./RepoDistributionSection";
import { deferred } from "../../../testUtils/deferred";

const repoCounts: SprintStats["repoCounts"] = [
    { repoName: "checkout-web", count: 3, proportion: 0.75 },
    { repoName: "checkout-api", count: 1, proportion: 0.25 },
];

describe("RepoDistributionSection", () => {
    it("renders a chart axis tick for each repo", () => {
        const { container } = render(<RepoDistributionSection repoCounts={repoCounts} onExport={vi.fn()} />);
        expect(screen.getByText("Repo distribution")).toBeInTheDocument();
        expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(container.textContent).toContain("checkout-web");
        expect(container.textContent).toContain("checkout-api");
    });

    it("forwards the ref to the chart's wrapping element, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(<RepoDistributionSection ref={ref} repoCounts={repoCounts} onExport={vi.fn()} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current?.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(ref.current?.textContent).not.toContain("Repo distribution");
    });

    it("wires up the export button, owning its own loading state while the export is in flight", async () => {
        const { promise, resolve } = deferred();
        const onExport = vi.fn(() => promise);
        render(<RepoDistributionSection repoCounts={repoCounts} onExport={onExport} />);

        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "exporting..." })).toBeDisabled();

        resolve();
        expect(await screen.findByRole("button", { name: "export pdf" })).toBeEnabled();
    });
});
