import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const PAGE_WIDTH_MM = 297; // landscape a4
const PAGE_HEIGHT_MM = 210;
const MARGIN_MM = 14;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const LINE_HEIGHT_MM = 5.5;

// a plain line of text, or a clickable hyperlink rendered as one.
export type PdfLine = string | { text: string; url: string };

// one page of the report: a heading, an optional chart/calendar screenshot,
// and optional written-out stats rendered as real pdf text below it (not
// part of the screenshot) - so the numbers are selectable/searchable text,
// not just pixels in an image.
export interface PdfSection {
    title: string;
    element?: HTMLElement;
    lines?: PdfLine[];
}

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    const backgroundColor = getComputedStyle(document.body).getPropertyValue("--surface").trim() || "#1a1a1a";
    return html2canvas(element, { backgroundColor, scale: 2 });
}

// draws the chart/calendar screenshot scaled to fill the content width (and
// shrunk further if that would overflow the space left for it), returns the
// y position immediately below it.
function drawImage(pdf: jsPDF, canvas: HTMLCanvasElement, y: number, maxHeightMm: number): number {
    const pxToMm = CONTENT_WIDTH_MM / canvas.width;
    const widthMm = canvas.width * pxToMm;
    const heightMm = canvas.height * pxToMm;
    const scale = heightMm > maxHeightMm ? maxHeightMm / heightMm : 1;
    const finalWidthMm = widthMm * scale;
    const finalHeightMm = heightMm * scale;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", MARGIN_MM, y, finalWidthMm, finalHeightMm);
    return y + finalHeightMm + 8;
}

// writes each line as real (wrapped) pdf text - link lines are drawn in the
// app's accent color as an actual clickable pdf annotation, not just text
// that happens to look like a url. Returns the y position below the last line.
function drawLines(pdf: jsPDF, lines: PdfLine[], y: number): number {
    pdf.setFontSize(11);
    let cursor = y;
    for (const line of lines) {
        if (typeof line === "string") {
            const wrapped: string[] = pdf.splitTextToSize(line, CONTENT_WIDTH_MM);
            pdf.text(wrapped, MARGIN_MM, cursor);
            cursor += wrapped.length * LINE_HEIGHT_MM + 2;
        } else {
            pdf.setTextColor(217, 119, 6); // --accent (#d97706), matching the app's on-screen link color
            pdf.textWithLink(line.text, MARGIN_MM, cursor, { url: line.url });
            pdf.setTextColor(0, 0, 0);
            cursor += LINE_HEIGHT_MM + 2;
        }
    }
    return cursor;
}

async function renderSection(pdf: jsPDF, section: PdfSection, isFirstPage: boolean): Promise<void> {
    if (!isFirstPage) {
        pdf.addPage();
    }

    let y = MARGIN_MM + 4;
    pdf.setFontSize(16);
    pdf.text(section.title, MARGIN_MM, y);
    y += 10;

    if (section.element) {
        const canvas = await captureElement(section.element);
        const reservedForText = section.lines ? section.lines.length * (LINE_HEIGHT_MM + 2) + 10 : 0;
        const maxHeightMm = PAGE_HEIGHT_MM - MARGIN_MM - y - reservedForText;
        y = drawImage(pdf, canvas, y, maxHeightMm);
    }

    if (section.lines && section.lines.length > 0) {
        drawLines(pdf, section.lines, y);
    }
}

// renders each section onto its own page (screenshotting section.element,
// where given, then writing section.lines as real text underneath) into a
// single pdf with one page per section.
export async function exportSectionsAsPdf(sections: PdfSection[], filename: string): Promise<void> {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    for (let i = 0; i < sections.length; i += 1) {
        await renderSection(pdf, sections[i], i === 0);
    }
    pdf.save(filename);
}
