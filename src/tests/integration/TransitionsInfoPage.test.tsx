import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { StatusFlowConfig } from "@shared/types";
import { TransitionsInfoPage } from "../../pages/TransitionsInfoPage";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({
    api: {
        getStatusFlow: vi.fn(),
    },
}));

const flow: StatusFlowConfig = {
    states: [
        { id: "NEW", label: "new", rank: 0, color: "#6b7280", description: "not started yet" },
        { id: "DONE", label: "done", rank: 1, color: "#008300", description: "fully released" },
    ],
    transitions: [{ from: "NEW", to: ["DONE"] }],
};

beforeEach(() => {
    vi.mocked(api.getStatusFlow).mockReset();
});

function renderPage() {
    return render(
        <MemoryRouter>
            <TransitionsInfoPage />
        </MemoryRouter>
    );
}

describe("transitions info page", () => {
    it("shows loading, then the flow diagram and state descriptions", async () => {
        vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
        renderPage();
        expect(screen.getByText("loading...")).toBeInTheDocument();

        expect(await screen.findByText("not started yet")).toBeInTheDocument();
        expect(screen.getByText("fully released")).toBeInTheDocument();
        expect(document.querySelector(".flow-diagram")).not.toBeNull();
    });

    it("lists states ordered by rank", async () => {
        vi.mocked(api.getStatusFlow).mockResolvedValue(flow);
        renderPage();
        await screen.findByText("not started yet");
        const labels = Array.from(document.querySelectorAll(".flow-state-entry .status-badge")).map((el) => el.textContent);
        expect(labels).toEqual(["new", "done"]);
    });
});
