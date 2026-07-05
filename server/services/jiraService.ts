import type { JiraInfo } from "../../shared/types.js";

interface JiraApiResponse {
    key: string;
    fields: {
        summary: string;
        labels: string[];
    };
}

// fetches basic info (title and labels) for a jira issue key. requires
// JIRA_BASE_URL, JIRA_EMAIL and JIRA_API_TOKEN to be set in the
// environment. returns null if not configured or the issue is missing.
export async function fetchJiraInfo(issueKey: string): Promise<JiraInfo | null> {
    const baseUrl: string | undefined = process.env.JIRA_BASE_URL;
    const email: string | undefined = process.env.JIRA_EMAIL;
    const apiToken: string | undefined = process.env.JIRA_API_TOKEN;

    if (!baseUrl || !email || !apiToken) {
        return null;
    }

    const auth: string = Buffer.from(`${email}:${apiToken}`).toString("base64");
    const response: Response = await fetch(
        `${baseUrl}/rest/api/3/issue/${issueKey}?fields=summary,labels`,
        {
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
        }
    );

    if (!response.ok) {
        return null;
    }

    const data: JiraApiResponse = (await response.json()) as JiraApiResponse;
    return {
        key: data.key,
        title: data.fields.summary,
        labels: data.fields.labels ?? [],
    };
}
