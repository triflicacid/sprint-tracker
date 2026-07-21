import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const PAGE_WIDTH_MM = 297; // landscape a4
const PAGE_HEIGHT_MM = 210;
const MARGIN_MM = 14;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const LINE_HEIGHT_MM = 5.5;

// a plain line of text, or a clickable hyperlink rendered as one.
export type PdfLine = string | { text: string; url: string };

// one cell of a PdfTable row - plain black text, or colored text (an rgb
// triple, e.g. to match a status pill's color) when `color` is given.
export interface PdfTableCell {
    text: string;
    color?: [number, number, number];
}

// a real, drawn pdf table (not a screenshot) - a header row plus data rows,
// each cell independently colorable. `columnWidths` (mm) default to an equal
// split of the page's content width if omitted.
export interface PdfTable {
    headers: string[];
    rows: PdfTableCell[][];
    columnWidths?: number[];
}

// one page of the report: a heading, an optional chart/calendar screenshot,
// an optional drawn table, and optional written-out stats rendered as real
// pdf text below it (not part of the screenshot) - so the numbers are
// selectable/searchable text, not just pixels in an image.
export interface PdfSection {
    title: string;
    // a small icon rasterized and drawn immediately before the title, e.g.
    // the story/bug type icon - pass the element wrapping the actual
    // rendered icon so the pdf shows the same glyph as the page, not a
    // redrawn approximation of it. Must be an HTMLElement wrapper, not a raw
    // <svg> root - html2canvas can't reliably capture an svg root directly.
    titleIcon?: HTMLElement;
    element?: HTMLElement;
    table?: PdfTable;
    lines?: PdfLine[];
}


async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    const backgroundColor = getComputedStyle(document.body).getPropertyValue("--surface").trim() || "#1a1a1a";
    return html2canvas(element, { backgroundColor, scale: 2 });
}

// like captureElement, but with a transparent background - for small
// decorative marks (e.g. the title icon) that should blend into the page
// rather than sit inside a themed rectangle.
async function captureIconElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, { backgroundColor: null, scale: 4 });
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

// draws a header row (dim gray, matching the on-page table's <th>) then each
// data row, positioning cells at fixed column offsets and coloring each
// cell's text independently. Returns the y position below the table.
function drawTable(pdf: jsPDF, table: PdfTable, y: number): number {
    const columnWidths = table.columnWidths ?? table.headers.map(() => CONTENT_WIDTH_MM / table.headers.length);
    let cursor = y;

    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175); // --text-dim
    let x = MARGIN_MM;
    table.headers.forEach((header, i) => {
        pdf.text(header, x, cursor);
        x += columnWidths[i];
    });
    cursor += LINE_HEIGHT_MM + 2;

    pdf.setFontSize(10);
    for (const row of table.rows) {
        x = MARGIN_MM;
        row.forEach((cell, i) => {
            pdf.setTextColor(...(cell.color ?? [0, 0, 0]));
            pdf.text(cell.text, x, cursor);
            x += columnWidths[i];
        });
        cursor += LINE_HEIGHT_MM;
    }

    pdf.setTextColor(0, 0, 0);
    return cursor + 4;
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
    pdf.setTextColor(0, 0, 0);
    let titleX = MARGIN_MM;
    if (section.titleIcon) {
        const iconCanvas = await captureIconElement(section.titleIcon);
        const iconHeightMm = 5;
        const iconWidthMm = (iconCanvas.width / iconCanvas.height) * iconHeightMm;
        pdf.addImage(iconCanvas.toDataURL("image/png"), "PNG", MARGIN_MM, y - iconHeightMm, iconWidthMm, iconHeightMm);
        titleX = MARGIN_MM + iconWidthMm + 3;
    }
    pdf.text(section.title, titleX, y);
    y += 10;

    if (section.element) {
        const canvas = await captureElement(section.element);
        const reservedForText = section.lines ? section.lines.length * (LINE_HEIGHT_MM + 2) + 10 : 0;
        const maxHeightMm = PAGE_HEIGHT_MM - MARGIN_MM - y - reservedForText;
        y = drawImage(pdf, canvas, y, maxHeightMm);
    }

    if (section.table) {
        y = drawTable(pdf, section.table, y);
    }

    if (section.lines && section.lines.length > 0) {
        drawLines(pdf, section.lines, y);
    }
}

// renders each section onto its own page (screenshotting section.element,
// where given, drawing section.table, then writing section.lines as real
// text underneath) into a single pdf with one page per section.
export async function exportSectionsAsPdf(sections: PdfSection[], filename: string): Promise<void> {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    for (let i = 0; i < sections.length; i += 1) {
        await renderSection(pdf, sections[i], i === 0);
    }
    pdf.save(filename);
}
