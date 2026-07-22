function toKebabSegment(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * generates a git-safe branch name from subtask metadata
 *
 * @param category subtask category/type prefix
 * @param jiraKey parent story jira key, if known
 * @param title subtask title to slugify
 * @returns generated branch name
 */
export function generateBranchName(category: string, jiraKey: string | null, title: string): string {
    const normalizedCategory = toKebabSegment(category) || "unknown";
    const normalizedJiraKey = jiraKey ? toKebabSegment(jiraKey).toUpperCase() : null;
    const slug = toKebabSegment(title);

    if (normalizedJiraKey && slug) {
        return `${normalizedCategory}/${normalizedJiraKey}-${slug}`;
    }
    if (normalizedJiraKey) {
        return `${normalizedCategory}/${normalizedJiraKey}`;
    }
    if (slug) {
        return `${normalizedCategory}/${slug}`;
    }
    return normalizedCategory;
}

