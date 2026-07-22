import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const PAGE_WIDTH_MM = 297; // landscape a4
const PAGE_HEIGHT_MM = 210;
const MARGIN_MM = 14;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const LINE_HEIGHT_MM = 5.5;

/**
 * a plain line of text, or a clickable hyperlink
 */
export type PdfLine = string | { text: string; url: string };

/**
 * one cell of a PDF table row
 *
 * plain black text by default, or colored text (rgb triple) when color is given
 */
export interface PdfTableCell {
    text: string;
    color?: [number, number, number];
}

/**
 * a drawn PDF table (not a screenshot)
 *
 * header row plus data rows, each cell independently colorable
 * columnWidths (mm) default to equal split of page width if omitted
 */
export interface PdfTable {
    headers: string[];
    rows: PdfTableCell[][];
    columnWidths?: number[];
}

/**
 * one page of the PDF report
 *
 * includes a heading, optional chart/calendar screenshot, optional drawn table,
 * and optional written stats as selectable text
 */
export interface PdfSection {
    title: string;
    /** small icon rasterized before the title (must be HTMLElement wrapper, not raw SVG) */
    titleIcon?: HTMLElement;
    element?: HTMLElement;
    table?: PdfTable;
    lines?: PdfLine[];
}


/**
 * waits until every recharts surface has been measured and painted
 *
 * @param element container element
 * @param timeoutMs timeout in milliseconds (default 3000)
 */
async function waitForChartsReady(element: HTMLElement, timeoutMs = 3000): Promise<void> {
    const surfaces = Array.from(element.querySelectorAll<SVGElement>(".recharts-surface"));
    if (surfaces.length === 0) return;

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const allMeasured = surfaces.every((svg) => {
            const [, , w] = (svg.getAttribute("viewBox") ?? "0 0 0 0").split(" ").map(Number);
            return w > 0;
        });
        if (allMeasured) {
            // one extra frame for custom label elements (e.g. SVG overlays
            // rendered via Recharts' `label` prop) to be appended.
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            return;
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
}

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    await waitForChartsReady(element);
    const backgroundColor = getComputedStyle(document.body).getPropertyValue("--surface").trim() || "#1a1a1a";
    return html2canvas(element, { backgroundColor, scale: 2 });
}

/**
 * captures an element with transparent background for decorative marks
 *
 * @param element element to capture
 * @returns canvas with the rendered element
 */
async function captureIconElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, { backgroundColor: null, scale: 4 });
}

/**
 * draws the chart/calendar screenshot scaled to fill content width
 *
 * @param pdf the PDF document
 * @param canvas the canvas to draw
 * @param y current y position
 * @param maxHeightMm maximum height in mm
 * @returns y position immediately below the image
 */
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

/**
 * draws a table with header row and data rows, coloring cells independently
 *
 * @param pdf the PDF document
 * @param table the table to draw
 * @param y current y position
 * @returns y position below the table
 */
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

/**
 * writes each line as wrapped PDF text, with link lines as clickable annotations
 *
 * @param pdf the PDF document
 * @param lines lines to write
 * @param y current y position
 * @returns y position below the last line
 */
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

/**
 * renders each section onto its own PDF page
 * 
 * screenshots section.element (where given), draws section.table, then writes
 * section.lines as selectable text
 * 
 * @param sections array of sections to export
 * @param filename output filename
 */
export async function exportSectionsAsPdf(sections: PdfSection[], filename: string): Promise<void> {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    for (let i = 0; i < sections.length; i += 1) {
        await renderSection(pdf, sections[i], i === 0);
    }
    pdf.save(filename);
}
