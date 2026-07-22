/**
 * generates a color for a story in the complexity-vs-running-time chart
 *
 * @param storyId story ID
 * @returns HSL color string
 */
export function colorForStory(storyId: number) {
    const hue = (storyId * 137.508) % 360;
    return `hsl(${hue}, 55%, 60%)`;
}
