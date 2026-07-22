import type { JiraInfo } from "../../shared/types.js";

interface JiraApiResponse {
    key: string;
    fields: {
        summary: string;
        labels: string[];
    };
}

/**
 * fetches jira info for an issue key.
 *
 * @param issueKey - jira issue key to fetch.
 * @returns jira info or `null` when jira is not configured or the issue is unavailable.
 */
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
