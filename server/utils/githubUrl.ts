/**
 * extracts a repo name from a github pull request url.
 *
 * @param url - github pull request url.
 * @returns the repo name or `unknown-repo` when parsing fails.
 */
export function extractRepoName(url: string) {
    const match = url.match(/github\.com\/[^/]+\/([^/]+)\/pull/);
    return match ? match[1] : "unknown-repo";
}

/**
 * extracts a jira issue key from a browse url.
 *
 * @param url - jira browse url.
 * @returns the jira issue key or `null` when parsing fails.
 */
export function extractJiraKey(url: string) {
    const match = url.match(/browse\/([A-Z][A-Z0-9]*-\d+)/);
    return match ? match[1] : null;
}
