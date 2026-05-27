/**
 * Dashboard view component.
 * Traces: REQ-003
 */

export function createDashboardView(data, { onMeetingClick, onActionItemClick } = {}) {
  const container = document.createElement('div');
  container.className = 'dashboard';

  // Hero section
  const hero = document.createElement('section');
  hero.className = 'dashboard__hero';

  const heading = document.createElement('h2');
  heading.textContent = 'Dashboard';

  const description = document.createElement('p');
  description.className = 'text-muted';
  description.textContent = 'Capture, organize, and track action items from team meetings.';

  hero.append(heading, description);

  // Stats cards
  const statsGrid = document.createElement('div');
  statsGrid.className = 'dashboard__stats grid grid--3';

  const stats = [
    { label: 'Total Meetings', value: data.totalMeetings, accent: 'var(--color-accent)' },
    { label: 'Action Items', value: data.totalActionItems, accent: 'var(--color-accent)' },
    { label: 'Overdue Items', value: data.overdueItems, accent: data.overdueItems > 0 ? 'var(--color-error, #ef4444)' : 'var(--color-accent)' },
  ];

  for (const stat of stats) {
    const card = document.createElement('div');
    card.className = 'dashboard__stat-card card';

    const value = document.createElement('div');
    value.className = 'dashboard__stat-value';
    value.textContent = stat.value;
    value.style.color = stat.accent;

    const label = document.createElement('div');
    label.className = 'dashboard__stat-label text-muted';
    label.textContent = stat.label;

    card.append(value, label);
    statsGrid.append(card);
  }

  // Recent meetings
  const meetingsSection = document.createElement('section');
  meetingsSection.className = 'card dashboard__section';

  const meetingsHeader = document.createElement('div');
  meetingsHeader.style.display = 'flex';
  meetingsHeader.style.justifyContent = 'space-between';
  meetingsHeader.style.alignItems = 'center';
  meetingsHeader.style.marginBottom = 'var(--space-md)';

  const meetingsHeading = document.createElement('h3');
  meetingsHeading.textContent = 'Recent Meetings';

  const viewAllLink = document.createElement('a');
  viewAllLink.href = '/meetings';
  viewAllLink.setAttribute('data-link', '');
  viewAllLink.textContent = 'View all';
  viewAllLink.className = 'text-muted';

  meetingsHeader.append(meetingsHeading, viewAllLink);
  meetingsSection.append(meetingsHeader);

  if (data.recentMeetings.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No meetings yet.';
    meetingsSection.append(empty);
  } else {
    for (const meeting of data.recentMeetings) {
      const row = document.createElement('div');
      row.className = 'dashboard__meeting-row';
      row.style.cursor = 'pointer';

      const title = document.createElement('span');
      title.className = 'dashboard__meeting-title';
      title.textContent = meeting.title;

      const date = document.createElement('span');
      date.className = 'dashboard__meeting-date text-muted';
      date.textContent = meeting.date ? new Date(meeting.date).toLocaleDateString() : '';

      row.append(title, date);
      row.addEventListener('click', () => {
        if (onMeetingClick) onMeetingClick(meeting.id);
      });
      meetingsSection.append(row);
    }
  }

  // Upcoming action items
  const aiSection = document.createElement('section');
  aiSection.className = 'card dashboard__section';

  const aiHeading = document.createElement('h3');
  aiHeading.textContent = 'Upcoming Action Items';
  aiHeading.style.marginBottom = 'var(--space-md)';
  aiSection.append(aiHeading);

  if (data.upcomingActionItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No outstanding action items.';
    aiSection.append(empty);
  } else {
    for (const ai of data.upcomingActionItems.slice(0, 10)) {
      const row = document.createElement('div');
      row.className = 'dashboard__ai-row';
      row.style.cursor = 'pointer';

      const title = document.createElement('span');
      title.className = 'dashboard__ai-title';
      title.textContent = ai.title;

      const meta = document.createElement('div');
      meta.className = 'dashboard__ai-meta';

      const badge = document.createElement('span');
      badge.className = `badge badge--${ai.status || 'open'}`;
      badge.textContent = ai.status || 'open';

      const assignee = document.createElement('span');
      assignee.className = 'text-muted';
      assignee.textContent = ai.assignee || '';

      if (ai.dueDate) {
        const dueSpan = document.createElement('span');
        const due = new Date(ai.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = due < today;
        dueSpan.textContent = `Due: ${due.toLocaleDateString()}`;
        dueSpan.style.color = isOverdue ? 'var(--color-error, #ef4444)' : 'var(--color-text-muted)';
        dueSpan.style.fontSize = 'var(--font-size-sm)';
        meta.append(badge, assignee, dueSpan);
      } else {
        meta.append(badge, assignee);
      }

      row.append(title, meta);
      row.addEventListener('click', () => {
        if (onActionItemClick) onActionItemClick(ai.id);
      });
      aiSection.append(row);
    }
  }

  container.append(hero, statsGrid, meetingsSection, aiSection);
  return container;
}
