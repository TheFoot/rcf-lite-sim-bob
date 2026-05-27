/**
 * Markdown rendering utility for the frontend.
 * Uses marked library served from the backend.
 */

import { marked } from '/vendor/marked.min.mjs';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render markdown string to HTML and insert into a container element.
 * Uses innerHTML with trusted server content (template markdown).
 * @param {HTMLElement} container
 * @param {string} markdownContent
 */
export function renderMarkdownInto(container, markdownContent) {
  if (!markdownContent) {
    container.textContent = 'No content.';
    return;
  }
  container.innerHTML = marked.parse(markdownContent);
  container.className = (container.className || '') + ' markdown-content';
}
