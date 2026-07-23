import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./client";

function mockFetchOnce(body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        statusText: init.statusText ?? "OK",
        json: async () => body,
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("request helper (via api methods)", () => {
    it("resolves with the parsed json body on a 200", async () => {
        mockFetchOnce([{ id: 1, name: "Sprint 1" }]);
        const sprints = await api.listSprints();
        expect(sprints).toEqual([{ id: 1, name: "Sprint 1" }]);
    });

    it("returns undefined for a 204 without parsing a body", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => {
            throw new Error("should not be called");
        } });
        vi.stubGlobal("fetch", fetchMock);
        await expect(api.removeStoryTag(1, 2)).resolves.toBeUndefined();
    });

    it("throws the server's error message on a non-ok response", async () => {
        mockFetchOnce({ error: "story not found" }, { ok: false, status: 404 });
        await expect(api.getStory(999)).rejects.toThrow("story not found");
    });

    it("falls back to statusText when the error body isn't valid json", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            json: async () => {
                throw new Error("not json");
            },
        });
        vi.stubGlobal("fetch", fetchMock);
        await expect(api.getStory(1)).rejects.toThrow("Internal Server Error");
    });
});

describe("api method URL/method/body construction", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = mockFetchOnce({});
    });

    it("createSprint POSTs to /api/sprints with a json body", async () => {
        await api.createSprint({ name: "Sprint 1", startDate: "2026-01-01" });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/sprints",
            expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Sprint 1", startDate: "2026-01-01" }) })
        );
    });

    it("getSprint GETs /api/sprints/:id", async () => {
        await api.getSprint(42);
        expect(fetchMock).toHaveBeenCalledWith("/api/sprints/42", expect.anything());
    });

    it("updateSubtask PATCHes /api/subtasks/:id", async () => {
        await api.updateSubtask(7, { status: "WIP", branchName: "feature/x" });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/subtasks/7",
            expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "WIP", branchName: "feature/x" }) })
        );
    });

    it("removeStoryTag DELETEs /api/stories/:id/tags/:tagId", async () => {
        await api.removeStoryTag(1, 2);
        expect(fetchMock).toHaveBeenCalledWith("/api/stories/1/tags/2", expect.objectContaining({ method: "DELETE" }));
    });

    it("getStatusBreakdown includes the granularity query param", async () => {
        await api.getStatusBreakdown(1, "story");
        expect(fetchMock).toHaveBeenCalledWith("/api/stats/status-breakdown/1?granularity=story", expect.anything());
    });

    it("getCalendar builds query params only for provided filters", async () => {
        await api.getCalendar({ repo: "checkout-web" });
        expect(fetchMock).toHaveBeenCalledWith("/api/calendar?repo=checkout-web", expect.anything());
    });

    it("getCalendar omits the query string entirely when no filters are given", async () => {
        await api.getCalendar({});
        expect(fetchMock).toHaveBeenCalledWith("/api/calendar", expect.anything());
    });

    it("getJiraInfo appends storyId only when provided", async () => {
        await api.getJiraInfo("NEB-1");
        expect(fetchMock).toHaveBeenCalledWith("/api/jira/NEB-1", expect.anything());

        await api.getJiraInfo("NEB-1", 5);
        expect(fetchMock).toHaveBeenCalledWith("/api/jira/NEB-1?storyId=5", expect.anything());
    });

    it("getSubtaskHistory GETs /api/subtasks/:id/history", async () => {
        await api.getSubtaskHistory(3);
        expect(fetchMock).toHaveBeenCalledWith("/api/subtasks/3/history", expect.anything());
    });

    it("search appends repeated tagId values and optional filters", async () => {
        await api.search({
            query: "auth",
            tagIds: [2, 5],
            project: "Nebula",
            entities: ["story", "subtask"],
            storyId: 11,
            subtaskType: "feature",
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/search?q=auth&tagId=2&tagId=5&project=Nebula&entities=story%2Csubtask&storyId=11&subtaskType=feature",
            expect.anything()
        );
    });

    it("search omits the query string when no params are supplied", async () => {
        await api.search({});
        expect(fetchMock).toHaveBeenCalledWith("/api/search", expect.anything());
    });
});
