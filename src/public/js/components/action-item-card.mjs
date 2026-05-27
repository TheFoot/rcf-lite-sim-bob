/**
 * Card component for ActionItem.
 * Traces: REQ-002
 */

export function createActionItemCard(item) {
  const card = document.createElement('article');
  card.className = 'action-item-card';
  card.dataset.id = item.id;
  card.style.cursor = 'pointer';

  const header = document.createElement('div');
  header.className = 'action-item-card__header';

  const titleElement = document.createElement('h4');
  titleElement.className = 'action-item-card__title';
  titleElement.textContent = item.title || '';

  const statusBadge = document.createElement('span');
  statusBadge.className = `badge badge--${item.status || 'open'}`;
  statusBadge.textContent = item.status || 'open';

  header.append(titleElement, statusBadge);

  const meta = document.createElement('div');
  meta.className = 'action-item-card__meta';

  if (item.assignee) {
    const assignee = document.createElement('span');
    assignee.textContent = item.assignee;
    meta.append(assignee);
  }

  if (item.dueDate) {
    const dueDate = document.createElement('span');
    dueDate.className = 'text-muted';
    const due = new Date(item.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = item.status !== 'done' && due < today;
    dueDate.textContent = `Due: ${due.toLocaleDateString()}`;
    if (isOverdue) {
      dueDate.style.color = 'var(--color-error)';
      dueDate.textContent += ' (overdue)';
    }
    meta.append(dueDate);
  }

  card.append(header, meta);
  return card;
}
