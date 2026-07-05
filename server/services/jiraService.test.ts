import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchJiraInfo } from "./jiraService.js";

beforeEach(() => {
    vi.stubEnv("JIRA_BASE_URL", "https://nebula.atlassian.net");
    vi.stubEnv("JIRA_EMAIL", "bot@nebula.dev");
    vi.stubEnv("JIRA_API_TOKEN", "secret-token");
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("fetchJiraInfo", () => {
    it("returns null when jira is not configured", async () => {
        vi.stubEnv("JIRA_BASE_URL", "");
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        expect(await fetchJiraInfo("NEB-1")).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns null when the jira api responds with a non-ok status", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
        expect(await fetchJiraInfo("NEB-1")).toBeNull();
    });

    it("fetches the right url with basic auth, and maps the response", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                key: "NEB-1001",
                fields: { summary: "Support saved cards", labels: ["payments"] },
            }),
        });
        vi.stubGlobal("fetch", fetchMock);

        const info = await fetchJiraInfo("NEB-1001");

        expect(info).toEqual({ key: "NEB-1001", title: "Support saved cards", labels: ["payments"] });
        expect(fetchMock).toHaveBeenCalledWith(
            "https://nebula.atlassian.net/rest/api/3/issue/NEB-1001?fields=summary,labels",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Basic ${Buffer.from("bot@nebula.dev:secret-token").toString("base64")}`,
                    Accept: "application/json",
                }),
            })
        );
    });

    it("defaults labels to an empty array when the issue has none", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ key: "NEB-1", fields: { summary: "x", labels: undefined } }),
            })
        );
        const info = await fetchJiraInfo("NEB-1");
        expect(info?.labels).toEqual([]);
    });
});
