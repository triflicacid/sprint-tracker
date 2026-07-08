import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { StatusBreakdownPoint } from "@shared/types";
import { StatusBreakdownSection } from "./StatusBreakdownSection";

const points: StatusBreakdownPoint[] = [{ date: "2026-03-10", counts: { NEW: 1, WIP: 1 } }];

describe("StatusBreakdownSection", () => {
    it("shows subtask status labels when granularity is subtask", () => {
        render(
            <StatusBreakdownSection points={points} granularity="subtask" onExport={vi.fn()} loading={false} />
        );
        expect(screen.getByText("Status breakdown")).toBeInTheDocument();
        expect(screen.getByText("new")).toBeInTheDocument();
        expect(screen.getByText("wip")).toBeInTheDocument();
    });

    it("switches to story status labels when granularity is story", () => {
        render(<StatusBreakdownSection points={points} granularity="story" onExport={vi.fn()} loading={false} />);
        expect(screen.getByText("new")).toBeInTheDocument();
    });

    it("forwards the ref to the chart's wrapping element, not the header", () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <StatusBreakdownSection ref={ref} points={points} granularity="subtask" onExport={vi.fn()} loading={false} />
        );
        expect(ref.current?.querySelector(".recharts-responsive-container")).not.toBeNull();
        expect(ref.current?.textContent).not.toContain("Status breakdown");
    });

    it("wires up the export button", async () => {
        const onExport = vi.fn();
        render(
            <StatusBreakdownSection points={points} granularity="subtask" onExport={onExport} loading={false} />
        );
        await userEvent.click(screen.getByRole("button", { name: "export pdf" }));
        expect(onExport).toHaveBeenCalledOnce();
    });
});
