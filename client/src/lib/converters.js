import { PDFDocument } from "pdf-lib";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function validateFiles(files, allowedTypes, label) {
  if (!files.length) throw new Error("Choose at least one file first.");
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name} is larger than the 50 MB per-file limit.`);
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    const typeAllowed =
      allowedTypes.includes(file.type) ||
      (extension && allowedTypes.includes(`.${extension}`));
    if (!typeAllowed) {
      throw new Error(`${file.name} is not a supported ${label} file.`);
    }
  }
}

export async function imagesToPdf(files) {
  validateFiles(files, ["image/jpeg", "image/png", ".jpg", ".jpeg", ".png"], "JPG or PNG image");
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
    const image = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return pdf.save();
}

export async function mergePdfs(files) {
  validateFiles(files, ["application/pdf", ".pdf"], "PDF");
  if (files.length < 2) throw new Error("Choose at least two PDF files to merge.");

  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  return output.save();
}

export async function splitPdf(file, rangeText) {
  validateFiles([file], ["application/pdf", ".pdf"], "PDF");
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = source.getPageCount();
  const selected = parsePageRanges(rangeText, pageCount);
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, selected.map((page) => page - 1));
  pages.forEach((page) => output.addPage(page));
  return output.save();
}

export function parsePageRanges(input, pageCount) {
  if (!input.trim()) throw new Error("Enter page numbers, for example 1-3, 5.");
  const selected = new Set();

  for (const rawPart of input.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;

    if (/^\d+$/.test(part)) {
      const page = Number(part);
      if (page < 1 || page > pageCount) {
        throw new Error(`Page ${page} is outside this PDF's 1–${pageCount} page range.`);
      }
      selected.add(page);
      continue;
    }

    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!range) throw new Error(`Invalid page range "${part}". Try 1-3, 5.`);
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`Range "${part}" is invalid. This PDF has ${pageCount} pages.`);
    }
    for (let page = start; page <= end; page++) selected.add(page);
  }

  if (!selected.size) throw new Error("Select at least one page.");
  return [...selected].sort((a, b) => a - b);
}

export function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
