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
    text: vi.fn(),
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
});
