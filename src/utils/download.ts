// triggers a browser download of in-memory text content, with no server
// round-trip needed beyond however the caller obtained the content.
export function downloadTextFile(filename: string, content: string, mimeType = "text/markdown"): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
