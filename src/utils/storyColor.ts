// story colour for the complexity-vs-running-time chart
export function colorForStory(storyId: number) {
    const hue = (storyId * 137.508) % 360;
    return `hsl(${hue}, 55%, 60%)`;
}
