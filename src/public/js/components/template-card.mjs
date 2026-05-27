/**
 * Card component for Template.
 * Enhanced from scaffold output.
 */

export function createTemplateCard(item) {
  const card = document.createElement('article');
  card.className = 'template-card';
  card.dataset.id = item.id;
  card.style.cursor = 'pointer';

  const nameHeading = document.createElement('h3');
  nameHeading.className = 'template-card__name';
  nameHeading.textContent = item.name || 'Untitled Template';

  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'badge badge--' + (item.category || 'other').replace(/\s+/g, '-');
  categoryBadge.textContent = (item.category || 'other').replace(/-/g, ' ');

  const contentPreview = document.createElement('p');
  contentPreview.className = 'template-card__preview text-muted';
  const preview = (item.content || '').replace(/[#*_\[\]]/g, '').slice(0, 120);
  contentPreview.textContent = preview + (preview.length >= 120 ? '...' : '');

  card.append(nameHeading, categoryBadge, contentPreview);
  return card;
}
