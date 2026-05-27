/**
 * Tests for tools/utils/docs.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderMarkdown,
  renderStyledHtml,
  createPdf,
  createDocx,
  exportReport,
} from '../docs.mjs';

/* ---------- renderMarkdown ---------------------------------------------- */

describe('renderMarkdown', () => {
  it('should convert a Markdown heading to HTML', () => {
    const html = renderMarkdown('# Hello');
    assert.ok(html.includes('<h1>'));
    assert.ok(html.includes('Hello'));
  });

  it('should support GFM features (tables, strikethrough)', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = renderMarkdown(md);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<td>1</td>'));
  });

  it('should convert bold and italic syntax', () => {
    const html = renderMarkdown('**bold** and *italic*');
    assert.ok(html.includes('<strong>bold</strong>'));
    assert.ok(html.includes('<em>italic</em>'));
  });

  it('should throw TypeError for non-string input', () => {
    assert.throws(() => renderMarkdown(42), { name: 'TypeError' });
    assert.throws(() => renderMarkdown(null), { name: 'TypeError' });
    assert.throws(() => renderMarkdown(undefined), { name: 'TypeError' });
  });

  it('should handle empty string', () => {
    const html = renderMarkdown('');
    assert.equal(typeof html, 'string');
  });
});

/* ---------- renderStyledHtml -------------------------------------------- */

describe('renderStyledHtml', () => {
  it('should produce a complete HTML document', () => {
    const html = renderStyledHtml('<p>Hello</p>');
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<html'));
    assert.ok(html.includes('</html>'));
    assert.ok(html.includes('<p>Hello</p>'));
  });

  it('should embed dark theme CSS tokens', () => {
    const html = renderStyledHtml('<p>Test</p>');
    assert.ok(html.includes('--color-primary'));
    assert.ok(html.includes('--color-accent'));
    assert.ok(html.includes('#1a2332'));
  });

  it('should use the provided title', () => {
    const html = renderStyledHtml('<p>Body</p>', { title: 'My Report' });
    assert.ok(html.includes('<title>My Report</title>'));
  });

  it('should default title to "Document"', () => {
    const html = renderStyledHtml('<p>Body</p>');
    assert.ok(html.includes('<title>Document</title>'));
  });

  it('should accept theme overrides', () => {
    const html = renderStyledHtml('<p>Body</p>', {
      theme: { colorPrimary: '#ff0000' },
    });
    assert.ok(html.includes('#ff0000'));
  });

  it('should escape HTML in title', () => {
    const html = renderStyledHtml('<p>Body</p>', { title: '<script>alert(1)</script>' });
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('should throw TypeError for non-string body', () => {
    assert.throws(() => renderStyledHtml(123), { name: 'TypeError' });
  });
});

/* ---------- createPdf --------------------------------------------------- */

describe('createPdf', () => {
  it('should return a Buffer containing PDF data', async () => {
    const buf = await createPdf({
      title: 'Test Report',
      sections: [{ heading: 'Section 1', body: 'Content here.' }],
    });
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 0);
    // PDF magic bytes: %PDF
    assert.ok(buf.toString('ascii', 0, 5).startsWith('%PDF'));
  });

  it('should handle multiple sections', async () => {
    const buf = await createPdf({
      title: 'Multi-section',
      sections: [
        { heading: 'A', body: 'First' },
        { heading: 'B', body: 'Second' },
        { heading: 'C', body: 'Third' },
      ],
    });
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 100);
  });

  it('should handle empty sections array', async () => {
    const buf = await createPdf({ title: 'Empty', sections: [] });
    assert.ok(Buffer.isBuffer(buf));
  });

  it('should throw TypeError for missing title', async () => {
    await assert.rejects(
      async () => createPdf({ sections: [{ heading: 'A', body: 'B' }] }),
      { name: 'TypeError' },
    );
  });

  it('should throw TypeError for missing sections', async () => {
    await assert.rejects(
      async () => createPdf({ title: 'X' }),
      { name: 'TypeError' },
    );
  });
});

/* ---------- createDocx -------------------------------------------------- */

describe('createDocx', () => {
  it('should return a Buffer containing DOCX data', async () => {
    const buf = await createDocx({
      title: 'Test Document',
      sections: [{ heading: 'Intro', body: 'Hello world.' }],
    });
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 0);
    // DOCX is a ZIP file -- starts with PK magic bytes
    assert.equal(buf[0], 0x50); // P
    assert.equal(buf[1], 0x4b); // K
  });

  it('should handle sections with multi-line body', async () => {
    const buf = await createDocx({
      title: 'Multiline',
      sections: [{ heading: 'A', body: 'Line one.\nLine two.\nLine three.' }],
    });
    assert.ok(Buffer.isBuffer(buf));
  });

  it('should throw TypeError for invalid input', async () => {
    await assert.rejects(async () => createDocx({}), { name: 'TypeError' });
  });
});

/* ---------- exportReport ------------------------------------------------ */

describe('exportReport', () => {
  const data = {
    title: 'Report',
    sections: [{ heading: 'Summary', body: 'All good.' }],
  };

  it('should export HTML format', async () => {
    const result = await exportReport(data, 'html');
    assert.equal(typeof result, 'string');
    assert.ok(result.includes('<!DOCTYPE html>'));
    assert.ok(result.includes('Summary'));
  });

  it('should export PDF format', async () => {
    const result = await exportReport(data, 'pdf');
    assert.ok(Buffer.isBuffer(result));
    assert.ok(result.toString('ascii', 0, 4) === '%PDF');
  });

  it('should export DOCX format', async () => {
    const result = await exportReport(data, 'docx');
    assert.ok(Buffer.isBuffer(result));
    assert.equal(result[0], 0x50);
  });

  it('should throw for unsupported format', async () => {
    await assert.rejects(
      async () => exportReport(data, 'txt'),
      { message: /Unsupported format/ },
    );
  });
});
