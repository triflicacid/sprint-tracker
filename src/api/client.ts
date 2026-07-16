import type {
    SprintSummary,
    SprintDetail,
    StoryDetail,
    StorySummary,
    Subtask,
    Tag,
    SprintStats,
    ComplexityStats,
    StatusBreakdownPoint,
    StatusBreakdownGranularity,
    DayActivityMap,
    CalendarEntry,
    JiraInfo,
    StatusFlowConfig,
    StatusHistoryEntry,
    MarkdownExportFields,
    SubtaskStatus,
    VelocityPoint,
    VelocitySelection,
} from "@shared/types";

const BASE_URL = "/api";

// generic request helper. throws with the server's error message when
// the response is not ok.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(body.error ?? "request failed");
    }
    if (response.status === 204) {
        return undefined as T;
    }
    return (await response.json()) as T;
}

// like request(), but for endpoints that return a raw text body (the
// markdown export) rather than JSON.
async function requestText(path: string, options?: RequestInit): Promise<string> {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(body.error ?? "request failed");
    }
    return response.text();
}


export const api = {
    listSprints: (): Promise<SprintSummary[]> => request("/sprints"),

    createSprint: (input: {
        name: string;
        startDate: string;
        endDate?: string;
        comment?: string;
    }): Promise<SprintSummary> =>
        request("/sprints", { method: "POST", body: JSON.stringify(input) }),

    getSprint: (id: number): Promise<SprintDetail> => request(`/sprints/${id}`),

    createStory: (
        sprintId: number,
        input: { jiraUrl: string; description: string; isBug?: boolean }
    ): Promise<StorySummary> =>
        request(`/sprints/${sprintId}/stories`, { method: "POST", body: JSON.stringify(input) }),

    getStory: (id: number): Promise<StoryDetail> => request(`/stories/${id}`),

    getSubtask: (id: number): Promise<Subtask> => request(`/subtasks/${id}`),

    getSubtaskHistory: (id: number): Promise<StatusHistoryEntry[]> => request(`/subtasks/${id}/history`),

    createSubtask: (storyId: number, input: { title: string }): Promise<Subtask> =>
        request(`/stories/${storyId}/subtasks`, { method: "POST", body: JSON.stringify(input) }),

    updateSubtask: (
        id: number,
        input: {
            title?: string;
            comment?: string;
            branchName?: string;
            status?: SubtaskStatus;
            prUrl?: string;
            releaseVersion?: string;
            complexityRating?: number;
        }
    ): Promise<Subtask> =>
        request(`/subtasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

    addStoryTag: (storyId: number, name: string): Promise<Tag> =>
        request(`/stories/${storyId}/tags`, { method: "POST", body: JSON.stringify({ name }) }),

    removeStoryTag: (storyId: number, tagId: number) =>
        request(`/stories/${storyId}/tags/${tagId}`, { method: "DELETE" }),

    listTags: (): Promise<Tag[]> => request("/tags"),

    getSprintStats: (sprintId: number): Promise<SprintStats> => request(`/stats/sprint/${sprintId}`),

    getComplexityTiming: (sprintId: number): Promise<ComplexityStats> =>
        request(`/stats/complexity-timing/${sprintId}`),

    getStatusBreakdown: (
        sprintId: number,
        granularity: StatusBreakdownGranularity
    ): Promise<StatusBreakdownPoint[]> => request(`/stats/status-breakdown/${sprintId}?granularity=${granularity}`),

    getDayActivity: (sprintId: number): Promise<DayActivityMap> => request(`/stats/day-activity/${sprintId}`),

    getAllDayActivity: (): Promise<DayActivityMap> => request("/stats/day-activity"),

    getVelocityHistory: (sprintId: number, selection: VelocitySelection): Promise<VelocityPoint[]> => {
        const params = new URLSearchParams({ mode: selection.mode });
        if (selection.mode === "range") {
            params.set("from", selection.from);
            params.set("to", selection.to);
        } else if (selection.mode === "lastN") {
            params.set("n", String(selection.n));
        }
        return request(`/stats/velocity/${sprintId}?${params.toString()}`);
    },

    listHolidays: (start: string, end: string): Promise<string[]> =>
        request(`/holidays?start=${start}&end=${end}`),

    addHoliday: (date: string) =>
        request(`/holidays`, { method: "POST", body: JSON.stringify({ date }) }),

    removeHoliday: (date: string) => request(`/holidays/${date}`, { method: "DELETE" }),

    getCalendar: (filter: { repo?: string; tag?: string; storyId?: number }): Promise<CalendarEntry[]> => {
        const params: URLSearchParams = new URLSearchParams();
        if (filter.repo) params.set("repo", filter.repo);
        if (filter.tag) params.set("tag", filter.tag);
        if (filter.storyId) params.set("storyId", String(filter.storyId));
        const query: string = params.toString();
        return request(`/calendar${query ? `?${query}` : ""}`);
    },

    getJiraInfo: (key: string, storyId?: number): Promise<JiraInfo> =>
        request(`/jira/${key}${storyId ? `?storyId=${storyId}` : ""}`),

    getStatusFlow: (): Promise<StatusFlowConfig> => request("/status-flow"),

    updateStory: (id: number, input: { awaitingMoreSubtasks?: boolean; storyPoints?: number | null }): Promise<StorySummary> =>
        request(`/stories/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

    updateSprint: (id: number, input: { comment?: string }): Promise<SprintDetail> =>
        request(`/sprints/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

    exportMarkdown: (sprintIds: number[], fields: MarkdownExportFields): Promise<string> =>
        requestText("/export/markdown", { method: "POST", body: JSON.stringify({ sprintIds, fields }) }),
};
