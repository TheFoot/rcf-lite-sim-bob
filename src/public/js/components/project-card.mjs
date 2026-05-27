/**
 * Card component for Project.
 * Enhanced from scaffold output.
 */

export function createProjectCard(item) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.dataset.id = item.id;
  card.style.cursor = 'pointer';

  const nameHeading = document.createElement('h3');
  nameHeading.className = 'project-card__name';
  nameHeading.textContent = item.name || 'Untitled Project';

  const statusBadge = document.createElement('span');
  statusBadge.className = `badge badge--${item.status || 'active'}`;
  statusBadge.textContent = item.status || 'active';

  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'project-card__description text-muted';
  descriptionElement.textContent = item.description || '';

  const meta = document.createElement('div');
  meta.className = 'project-card__meta';

  if (item.deadline) {
    const deadlineEl = document.createElement('span');
    deadlineEl.className = 'project-card__deadline';
    const date = new Date(item.deadline);
    deadlineEl.textContent = `Due: ${date.toLocaleDateString()}`;
    meta.append(deadlineEl);
  }

  if (item.team) {
    const teamEl = document.createElement('span');
    teamEl.className = 'project-card__team text-muted';
    teamEl.textContent = item.team;
    meta.append(teamEl);
  }

  card.append(nameHeading, statusBadge, descriptionElement, meta);
  return card;
}
