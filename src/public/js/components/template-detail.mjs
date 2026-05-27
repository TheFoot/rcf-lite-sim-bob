/**
 * Detail component for Template.
 * Enhanced from scaffold output -- renders markdown content.
 */

export function createTemplateDetail({ item, onEdit, onDelete, renderMarkdown } = {}) {
  const container = document.createElement('section');
  container.className = 'template-detail';

  const heading = document.createElement('h2');
  heading.textContent = item.name || 'Template Detail';

  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'badge badge--' + (item.category || 'other').replace(/\s+/g, '-');
  categoryBadge.textContent = (item.category || 'other').replace(/-/g, ' ');
  categoryBadge.style.marginBottom = 'var(--space-lg)';
  categoryBadge.style.display = 'inline-block';

  // Rendered markdown content
  const contentSection = document.createElement('div');
  contentSection.className = 'template-detail__content markdown-content';
  if (renderMarkdown && item.content) {
    renderMarkdown(contentSection, item.content);
  } else {
    contentSection.textContent = item.content || 'No content.';
  }

  const actions = document.createElement('div');
  actions.className = 'template-detail__actions';

  const editButton = document.createElement('button');
  editButton.className = 'btn btn-primary';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => { if (onEdit) onEdit(item); });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn--danger';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this template?')) {
      if (onDelete) onDelete(item);
    }
  });

  actions.append(editButton, deleteButton);
  container.append(heading, categoryBadge, contentSection, actions);
  return container;
}
