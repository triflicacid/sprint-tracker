/**
 * triggers a browser download of in-memory text content
 *
 * @param filename download filename
 * @param content text content to download
 * @param mimeType MIME type (defaults to "text/markdown")
 */
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
