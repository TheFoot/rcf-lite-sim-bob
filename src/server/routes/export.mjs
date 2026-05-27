/**
 * Document assembly and export routes.
 * Uses tools/utils/docs.mjs for PDF and DOCX generation.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderMarkdown, renderStyledHtml, createPdf, createDocx } from '../../../tools/utils/docs.mjs';

const DATA_DIR = join(process.cwd(), 'data');

async function loadJSON(filename) {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, filename), 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Assemble approved/locked sections from a project into a document.
 * Returns { sections, title, html } where html is the fully rendered assembly.
 */
async function assembleSections(projectId) {
  const [projects, sections] = await Promise.all([
    loadJSON('projects.json'),
    loadJSON('sections.json'),
  ]);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  // Get approved and locked sections, sorted by order
  const qualifyingSections = sections
    .filter((s) => s.projectId === projectId && (s.status === 'approved' || s.status === 'locked'))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Build table of contents and numbered sections
  const tocEntries = [];
  const sectionHtml = [];

  qualifyingSections.forEach((section, index) => {
    const num = index + 1;
    tocEntries.push(`<li><a href="#section-${num}">${num}. ${escapeHtml(section.name)}</a></li>`);

    const renderedContent = renderMarkdown(section.content || '');
    sectionHtml.push(`
      <section id="section-${num}" class="assembled-section">
        <h2>${num}. ${escapeHtml(section.name)}</h2>
        <div class="section-content">${renderedContent}</div>
        ${section.approvedBy ? `<p class="section-meta">Approved by ${escapeHtml(section.approvedBy)}${section.approvedAt ? ` on ${new Date(section.approvedAt).toLocaleDateString()}` : ''}</p>` : ''}
      </section>
    `);
  });

  const tocHtml = tocEntries.length > 0
    ? `<nav class="table-of-contents"><h2>Table of Contents</h2><ol>${tocEntries.join('\n')}</ol></nav>`
    : '';

  const bodyHtml = `
    <header class="document-header">
      <h1>${escapeHtml(project.name)}</h1>
      ${project.description ? `<p class="document-description">${escapeHtml(project.description)}</p>` : ''}
      <p class="document-date">Generated: ${new Date().toLocaleDateString()}</p>
    </header>
    ${tocHtml}
    ${sectionHtml.join('\n')}
  `;

  const html = renderStyledHtml(bodyHtml, { title: project.name });

  return {
    project,
    sections: qualifyingSections,
    title: project.name,
    html,
    bodyHtml,
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strip HTML tags for plain text (used in PDF/DOCX body).
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

async function assembleDocument(req, res) {
  const result = await assembleSections(req.params.id);
  if (!result) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } });
  }
  res.json({
    title: result.title,
    html: result.html,
    sectionCount: result.sections.length,
  });
}

async function exportDocument(req, res) {
  const format = req.params.format;
  if (!['pdf', 'docx'].includes(format)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Format must be pdf or docx.' } });
  }

  const result = await assembleSections(req.params.id);
  if (!result) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } });
  }

  // Build sections array for the docs utility
  const docSections = result.sections.map((section, index) => ({
    heading: `${index + 1}. ${section.name}`,
    body: stripHtml(renderMarkdown(section.content || '')),
  }));

  try {
    if (format === 'pdf') {
      const buffer = await createPdf({ title: result.title, sections: docSections });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.send(buffer);
    } else {
      const buffer = await createDocx({ title: result.title, sections: docSections });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${result.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`);
      res.send(buffer);
    }
  } catch (err) {
    console.error(`Export error (${format}):`, err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate document.' } });
  }
}

export function registerExportRoutes(router) {
  router.get('/projects/:id/assemble', assembleDocument);
  router.get('/projects/:id/export/:format', exportDocument);
}
