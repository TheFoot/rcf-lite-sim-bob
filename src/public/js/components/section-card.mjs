/**
 * Card component for Section (working copy).
 */

export function createSectionCard(item) {
  const card = document.createElement('article');
  card.className = 'section-card';
  card.dataset.id = item.id;
  card.style.cursor = 'pointer';

  const header = document.createElement('div');
  header.className = 'section-card__header';

  const nameHeading = document.createElement('h4');
  nameHeading.className = 'section-card__name';
  nameHeading.textContent = item.name || 'Untitled Section';

  const statusBadge = document.createElement('span');
  statusBadge.className = `badge badge--${item.status || 'draft'}`;
  statusBadge.textContent = (item.status || 'draft').replace(/-/g, ' ');

  header.append(nameHeading, statusBadge);

  const meta = document.createElement('div');
  meta.className = 'section-card__meta text-muted';

  if (item.approvedBy) {
    const approver = document.createElement('span');
    approver.textContent = `Approved by ${item.approvedBy}`;
    meta.append(approver);
  }

  if (item.order) {
    const order = document.createElement('span');
    order.textContent = `Section ${item.order}`;
    meta.append(order);
  }

  card.append(header, meta);
  return card;
}
