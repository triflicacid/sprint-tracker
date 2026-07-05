// extracts the repo name from a github pull request url, e.g.
// https://github.com/org/some-repo/pull/123 -> "some-repo".
export function extractRepoName(url: string) {
    const match = url.match(/github\.com\/[^/]+\/([^/]+)\/pull/);
    return match ? match[1] : "unknown-repo";
}

// extracts a jira issue key from a jira browse url, e.g.
// https://company.atlassian.net/browse/ABC-123 -> "ABC-123".
export function extractJiraKey(url: string) {
    const match = url.match(/browse\/([A-Z][A-Z0-9]*-\d+)/);
    return match ? match[1] : null;
}
