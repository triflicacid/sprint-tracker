import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportSectionsAsPdf, type PdfSection } from "./pdfExport";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({ jsPDF: vi.fn() }));

function fakeCanvas(width: number, height: number): HTMLCanvasElement {
    return { width, height, toDataURL: () => `data:image/png;base64,${width}x${height}` } as unknown as HTMLCanvasElement;
}

const pdfInstance = {
    addImage: vi.fn(),
    addPage: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    textWithLink: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    save: vi.fn(),
};

beforeEach(() => {
    vi.mocked(html2canvas).mockReset();
    vi.mocked(jsPDF).mockReset();
    Object.values(pdfInstance).forEach((fn) => fn.mockClear());
    pdfInstance.splitTextToSize.mockImplementation((text: string) => [text]);
    vi.mocked(jsPDF).mockImplementation(function () {
        return pdfInstance as unknown as jsPDF;
    } as unknown as typeof jsPDF);
});

describe("exportSectionsAsPdf", () => {
    it("writes the title and captures the element for a single image section", async () => {
        const element = document.createElement("div");
        vi.mocked(html2canvas).mockResolvedValue(fakeCanvas(2000, 800));
        const sections: PdfSection[] = [{ title: "Repo distribution", element, lines: ["repo-a: 3 PRs (100%)"] }];

        await exportSectionsAsPdf(sections, "one-page.pdf");

        expect(html2canvas).toHaveBeenCalledTimes(1);
        expect(html2canvas).toHaveBeenCalledWith(element, expect.objectContaining({ scale: 2 }));
        expect(jsPDF).toHaveBeenCalledWith({ orientation: "landscape", unit: "mm", format: "a4" });
        expect(pdfInstance.addPage).not.toHaveBeenCalled();
        expect(pdfInstance.text).toHaveBeenCalledWith("Repo distribution", expect.any(Number), expect.any(Number));
        expect(pdfInstance.addImage).toHaveBeenCalledTimes(1);
        expect(pdfInstance.text).toHaveBeenCalledWith(["repo-a: 3 PRs (100%)"], expect.any(Number), expect.any(Number));
        expect(pdfInstance.save).toHaveBeenCalledWith("one-page.pdf");
    });

    it("writes a text-only section (no chart) without capturing anything", async () => {
        const sections: PdfSection[] = [
            { title: "Summary - Sprint 1", lines: ["Pull requests: 2", "Stories: 1"] },
        ];

        await exportSectionsAsPdf(sections, "summary.pdf");

        expect(html2canvas).not.toHaveBeenCalled();
        expect(pdfInstance.addImage).not.toHaveBeenCalled();
        expect(pdfInstance.text).toHaveBeenCalledWith("Summary - Sprint 1", expect.any(Number), expect.any(Number));
        expect(pdfInstance.text).toHaveBeenCalledWith(["Pull requests: 2"], expect.any(Number), expect.any(Number));
        expect(pdfInstance.text).toHaveBeenCalledWith(["Stories: 1"], expect.any(Number), expect.any(Number));
    });

    it("captures every section in order and saves one multi-page pdf", async () => {
        const elements = [document.createElement("div"), document.createElement("div")];
        vi.mocked(html2canvas)
            .mockResolvedValueOnce(fakeCanvas(1000, 500))
            .mockResolvedValueOnce(fakeCanvas(1000, 500));
        const sections: PdfSection[] = [
            { title: "Summary", lines: ["Pull requests: 2"] },
            { title: "Repo distribution", element: elements[0], lines: ["repo-a: 2 PRs (100%)"] },
            { title: "Calendar", element: elements[1] },
        ];

        await exportSectionsAsPdf(sections, "multi-page.pdf");

        expect(html2canvas).toHaveBeenCalledTimes(2);
        expect(html2canvas).toHaveBeenNthCalledWith(1, elements[0], expect.anything());
        expect(html2canvas).toHaveBeenNthCalledWith(2, elements[1], expect.anything());

        // one addPage per page after the first - never before the first
        expect(pdfInstance.addPage).toHaveBeenCalledTimes(2);
        expect(pdfInstance.addImage).toHaveBeenCalledTimes(2);
        expect(jsPDF).toHaveBeenCalledTimes(1);
        expect(pdfInstance.save).toHaveBeenCalledWith("multi-page.pdf");
    });

    it("saves a single-page pdf (no addPage calls) when given only one section", async () => {
        const sections: PdfSection[] = [{ title: "Summary", lines: ["Stories: 1"] }];

        await exportSectionsAsPdf(sections, "single.pdf");

        expect(pdfInstance.addPage).not.toHaveBeenCalled();
    });

    it("renders a link line as a real clickable pdf link, in the accent color, and resets color afterwards", async () => {
        const sections: PdfSection[] = [
            {
                title: "Story",
                lines: [{ text: "Jira: NEB-1", url: "https://example.atlassian.net/browse/NEB-1" }, "Status: new"],
            },
        ];

        await exportSectionsAsPdf(sections, "story.pdf");

        expect(pdfInstance.textWithLink).toHaveBeenCalledWith(
            "Jira: NEB-1",
            expect.any(Number),
            expect.any(Number),
            { url: "https://example.atlassian.net/browse/NEB-1" }
        );
        // plain text is never passed through textWithLink
        expect(pdfInstance.textWithLink).toHaveBeenCalledTimes(1);
        expect(pdfInstance.text).toHaveBeenCalledWith(["Status: new"], expect.any(Number), expect.any(Number));

        // color set to the accent color for the link, then reset to black
        // immediately after (renderSection also resets to black once up front,
        // before the title, so the accent call isn't necessarily first overall).
        const colorCalls = pdfInstance.setTextColor.mock.calls;
        const accentCallIndex = colorCalls.findIndex((call) => call[0] === 217 && call[1] === 119 && call[2] === 6);
        expect(accentCallIndex).toBeGreaterThanOrEqual(0);
        expect(colorCalls[accentCallIndex + 1]).toEqual([0, 0, 0]);
    });

    it("draws a real table (not a screenshot), coloring each cell independently and resetting to black afterwards", async () => {
        const sections: PdfSection[] = [
            {
                title: "add card deletion endpoint",
                table: {
                    headers: ["date/time", "state", "time in previous"],
                    columnWidths: [50, 50, 50],
                    rows: [
                        [{ text: "2026-03-05 10:00" }, { text: "pr comments", color: [230, 103, 103] }, { text: "-" }],
                        [{ text: "2026-03-05 17:00" }, { text: "in review", color: [201, 133, 0] }, { text: "0d 7h 0m" }],
                    ],
                },
            },
        ];

        await exportSectionsAsPdf(sections, "table.pdf");

        expect(html2canvas).not.toHaveBeenCalled();
        // headers drawn in the dim gray, not black or a status color
        expect(pdfInstance.text).toHaveBeenCalledWith("date/time", expect.any(Number), expect.any(Number));
        expect(pdfInstance.text).toHaveBeenCalledWith("state", expect.any(Number), expect.any(Number));

        // every cell's actual text is drawn as real pdf text (searchable),
        // not baked into an image
        expect(pdfInstance.text).toHaveBeenCalledWith("2026-03-05 10:00", expect.any(Number), expect.any(Number));
        expect(pdfInstance.text).toHaveBeenCalledWith("pr comments", expect.any(Number), expect.any(Number));
        expect(pdfInstance.text).toHaveBeenCalledWith("in review", expect.any(Number), expect.any(Number));
        expect(pdfInstance.text).toHaveBeenCalledWith("0d 7h 0m", expect.any(Number), expect.any(Number));

        // each status cell's own color was applied before drawing it
        const colorCalls = pdfInstance.setTextColor.mock.calls;
        expect(colorCalls).toContainEqual([230, 103, 103]);
        expect(colorCalls).toContainEqual([201, 133, 0]);
        // and reset back to black for any plain (uncolored) cell/text after
        expect(colorCalls).toContainEqual([0, 0, 0]);
    });

    it("positions table columns using the given columnWidths, left to right", async () => {
        const sections: PdfSection[] = [
            {
                title: "Subtask",
                table: {
                    headers: ["a", "b"],
                    columnWidths: [30, 40],
                    rows: [[{ text: "cell-a" }, { text: "cell-b" }]],
                },
            },
        ];

        await exportSectionsAsPdf(sections, "columns.pdf");

        const cellACall = pdfInstance.text.mock.calls.find((call) => call[0] === "cell-a");
        const cellBCall = pdfInstance.text.mock.calls.find((call) => call[0] === "cell-b");
        expect(cellACall).toBeDefined();
        expect(cellBCall).toBeDefined();
        // cell-b's x position is 30mm (column a's width) to the right of cell-a's
        expect(cellBCall![1]).toBe(cellACall![1] + 30);
    });
});
