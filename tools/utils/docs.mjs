/**
 * Document format handling utilities.
 *
 * Provides Markdown rendering, styled HTML wrapping, PDF generation (pdfkit),
 * and DOCX generation (docx).  All functions are pure ESM.
 */

import { marked } from 'marked';
import PDFDocument from 'pdfkit';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
} from 'docx';

/* ---------- Markdown ---------------------------------------------------- */

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render a Markdown string to an HTML fragment.
 * @param {string} markdownString
 * @returns {string} HTML string
 */
export function renderMarkdown(markdownString) {
  if (typeof markdownString !== 'string') {
    throw new TypeError('markdownString must be a string');
  }
  return marked.parse(markdownString);
}

/* ---------- Styled HTML ------------------------------------------------- */

const DEFAULT_THEME = {
  colorPrimary: '#1a2332',
  colorPrimaryLight: '#243044',
  colorAccent: '#00b4d8',
  colorAccentHover: '#0096b7',
  colorText: '#ffffff',
  colorTextMuted: '#94a3b8',
  colorSurface: '#1e293b',
  colorBorder: '#334155',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSizeBase: '1rem',
  fontSizeSm: '0.875rem',
  fontSizeLg: '1.25rem',
  spacingUnit: '0.5rem',
  radius: '6px',
};

/**
 * Wrap an HTML body fragment in a full HTML document with embedded CSS that
 * uses the dark-theme tokens from spa-patterns.md.
 *
 * @param {string} bodyHtml  - inner HTML content
 * @param {object} [opts]
 * @param {string} [opts.title]  - document <title>
 * @param {object} [opts.theme]  - partial overrides for DEFAULT_THEME
 * @returns {string} complete HTML document string
 */
export function renderStyledHtml(bodyHtml, { title = 'Document', theme = {} } = {}) {
  if (typeof bodyHtml !== 'string') {
    throw new TypeError('bodyHtml must be a string');
  }

  const t = { ...DEFAULT_THEME, ...theme };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root {
  --color-primary: ${t.colorPrimary};
  --color-primary-light: ${t.colorPrimaryLight};
  --color-accent: ${t.colorAccent};
  --color-accent-hover: ${t.colorAccentHover};
  --color-text: ${t.colorText};
  --color-text-muted: ${t.colorTextMuted};
  --color-surface: ${t.colorSurface};
  --color-border: ${t.colorBorder};
  --font-family: ${t.fontFamily};
  --font-size-base: ${t.fontSizeBase};
  --font-size-sm: ${t.fontSizeSm};
  --font-size-lg: ${t.fontSizeLg};
  --spacing-unit: ${t.spacingUnit};
  --radius: ${t.radius};
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-primary);
  line-height: 1.6;
  padding: calc(var(--spacing-unit) * 4);
}
h1, h2, h3, h4 { margin: 1.5em 0 0.5em; color: var(--color-accent); }
h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
p { margin: 0.75em 0; }
a { color: var(--color-accent); }
a:hover { color: var(--color-accent-hover); }
code { background: var(--color-surface); padding: 0.15em 0.4em; border-radius: var(--radius); font-size: var(--font-size-sm); }
pre { background: var(--color-surface); padding: 1em; border-radius: var(--radius); overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 3px solid var(--color-accent); padding-left: 1em; color: var(--color-text-muted); margin: 1em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid var(--color-border); padding: 0.5em 0.75em; text-align: left; }
th { background: var(--color-surface); }
ul, ol { padding-left: 1.5em; margin: 0.75em 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/* ---------- PDF --------------------------------------------------------- */

/**
 * Create a PDF document with a title page and sections.
 *
 * @param {object} data
 * @param {string} data.title
 * @param {Array<{heading: string, body: string}>} data.sections
 * @returns {Promise<Buffer>}
 */
export function createPdf({ title, sections }) {
  if (!title || !Array.isArray(sections)) {
    throw new TypeError('title (string) and sections (array) are required');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 72 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title page
    doc.moveDown(8);
    doc.fontSize(28).text(title, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).fillColor('#666666').text(new Date().toLocaleDateString(), { align: 'center' });
    doc.fillColor('#000000');

    // Sections
    for (const section of sections) {
      doc.addPage();
      doc.fontSize(20).text(section.heading || 'Untitled Section');
      doc.moveDown(0.5);
      doc.fontSize(12).text(section.body || '', { lineGap: 4 });
    }

    doc.end();
  });
}

/* ---------- DOCX -------------------------------------------------------- */

/**
 * Create a DOCX document with a title and sections.
 *
 * @param {object} data
 * @param {string} data.title
 * @param {Array<{heading: string, body: string}>} data.sections
 * @returns {Promise<Buffer>}
 */
export async function createDocx({ title, sections }) {
  if (!title || !Array.isArray(sections)) {
    throw new TypeError('title (string) and sections (array) are required');
  }

  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString(),
          color: '666666',
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
  ];

  for (const section of sections) {
    children.push(
      new Paragraph({
        text: section.heading || 'Untitled Section',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    const bodyLines = (section.body || '').split('\n');
    for (const line of bodyLines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

/* ---------- Convenience wrapper ----------------------------------------- */

/**
 * Export a report in the requested format.
 *
 * @param {object} data       - { title, sections }
 * @param {'html'|'pdf'|'docx'} format
 * @returns {Promise<string|Buffer>}
 */
export async function exportReport(data, format) {
  switch (format) {
    case 'html': {
      const bodyHtml = data.sections
        .map((s) => `<h2>${escapeHtml(s.heading || '')}</h2>\n<p>${escapeHtml(s.body || '')}</p>`)
        .join('\n');
      return renderStyledHtml(bodyHtml, { title: data.title });
    }
    case 'pdf':
      return createPdf(data);
    case 'docx':
      return createDocx(data);
    default:
      throw new Error(`Unsupported format: ${format}. Use 'html', 'pdf', or 'docx'.`);
  }
}

/* ---------- Helpers ----------------------------------------------------- */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
