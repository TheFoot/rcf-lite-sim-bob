/**
 * Dashboard view component.
 * Shows project summaries, blocking sections, team activity, and deadlines.
 */

export function createDashboardView(data, { onProjectClick } = {}) {
  const container = document.createElement('div');
  container.className = 'dashboard';

  // Hero section
  const hero = document.createElement('section');
  hero.className = 'dashboard__hero';
  const heroHeading = document.createElement('h2');
  heroHeading.textContent = 'Dashboard';
  const heroSummary = document.createElement('p');
  heroSummary.className = 'text-muted';
  const totalProjects = data.projects?.length || 0;
  const totalBlocking = data.blockingSections?.length || 0;
  heroSummary.textContent = `${totalProjects} active project${totalProjects !== 1 ? 's' : ''}, ${totalBlocking} section${totalBlocking !== 1 ? 's' : ''} need attention.`;
  hero.append(heroHeading, heroSummary);
  container.append(hero);

  // Project summary cards
  if (data.projects && data.projects.length > 0) {
    const projectsSection = document.createElement('section');
    projectsSection.className = 'dashboard__projects';

    const projectsHeading = document.createElement('h3');
    projectsHeading.textContent = 'Project Overview';
    projectsHeading.style.marginBottom = 'var(--space-md)';
    projectsSection.append(projectsHeading);

    const grid = document.createElement('div');
    grid.className = 'grid grid--3';

    for (const project of data.projects) {
      const card = document.createElement('article');
      card.className = 'dashboard-project-card';
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => onProjectClick && onProjectClick(project.id));

      const name = document.createElement('h4');
      name.textContent = project.name;

      const progress = document.createElement('div');
      progress.className = 'progress-bar';
      const fill = document.createElement('div');
      fill.className = 'progress-bar__fill';
      fill.style.width = `${project.completionPercent}%`;
      progress.append(fill);

      const pctText = document.createElement('span');
      pctText.className = 'text-muted';
      pctText.textContent = `${project.completionPercent}% complete (${project.totalSections} sections)`;
      pctText.style.fontSize = 'var(--font-size-sm)';

      const statusRow = document.createElement('div');
      statusRow.className = 'dashboard-project-card__statuses';
      const counts = project.statusCounts || {};
      for (const [status, count] of Object.entries(counts)) {
        if (count > 0) {
          const badge = document.createElement('span');
          badge.className = `badge badge--${status}`;
          badge.textContent = `${count} ${status.replace(/-/g, ' ')}`;
          statusRow.append(badge);
        }
      }

      card.append(name, progress, pctText, statusRow);
      grid.append(card);
    }

    projectsSection.append(grid);
    container.append(projectsSection);
  }

  // Two-column layout for blocking sections and activity
  const twoCol = document.createElement('div');
  twoCol.className = 'grid grid--2';
  twoCol.style.marginTop = 'var(--space-xl)';

  // Blocking sections
  const blockingSection = document.createElement('section');
  blockingSection.className = 'card';

  const blockingHeading = document.createElement('h3');
  blockingHeading.textContent = 'Blocking Sections';
  blockingHeading.style.marginBottom = 'var(--space-md)';
  blockingSection.append(blockingHeading);

  if (data.blockingSections && data.blockingSections.length > 0) {
    const list = document.createElement('div');
    list.className = 'blocking-list';
    list.style.maxHeight = '300px';
    list.style.overflowY = 'auto';

    for (const section of data.blockingSections) {
      const item = document.createElement('div');
      item.className = 'blocking-item';

      const nameEl = document.createElement('span');
      nameEl.textContent = section.name;

      const badge = document.createElement('span');
      badge.className = `badge badge--${section.status}`;
      badge.textContent = section.status.replace(/-/g, ' ');

      const projectEl = document.createElement('span');
      projectEl.className = 'text-muted';
      projectEl.textContent = section.projectName;
      projectEl.style.fontSize = 'var(--font-size-sm)';

      item.append(nameEl, badge, projectEl);
      list.append(item);
    }
    blockingSection.append(list);
  } else {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No blocking sections. All clear!';
    blockingSection.append(empty);
  }

  // Activity feed
  const activitySection = document.createElement('section');
  activitySection.className = 'card';

  const activityHeading = document.createElement('h3');
  activityHeading.textContent = 'Team Activity';
  activityHeading.style.marginBottom = 'var(--space-md)';
  activitySection.append(activityHeading);

  if (data.recentActivity && data.recentActivity.length > 0) {
    const list = document.createElement('div');
    list.className = 'activity-list';
    list.style.maxHeight = '300px';
    list.style.overflowY = 'auto';

    for (const activity of data.recentActivity.slice(0, 10)) {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const text = document.createElement('span');
      const date = new Date(activity.approvedAt).toLocaleDateString();
      text.textContent = `${activity.approvedBy} ${activity.status === 'locked' ? 'locked' : 'approved'} "${activity.sectionName}"`;

      const dateEl = document.createElement('span');
      dateEl.className = 'text-muted';
      dateEl.textContent = date;
      dateEl.style.fontSize = 'var(--font-size-sm)';

      const projectEl = document.createElement('span');
      projectEl.className = 'text-muted';
      projectEl.textContent = activity.projectName;
      projectEl.style.fontSize = 'var(--font-size-sm)';

      item.append(text, projectEl, dateEl);
      list.append(item);
    }
    activitySection.append(list);
  } else {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No recent activity.';
    activitySection.append(empty);
  }

  twoCol.append(blockingSection, activitySection);
  container.append(twoCol);

  // Upcoming deadlines
  if (data.upcomingDeadlines && data.upcomingDeadlines.length > 0) {
    const deadlineSection = document.createElement('section');
    deadlineSection.className = 'card';
    deadlineSection.style.marginTop = 'var(--space-xl)';

    const deadlineHeading = document.createElement('h3');
    deadlineHeading.textContent = 'Upcoming Deadlines';
    deadlineHeading.style.marginBottom = 'var(--space-md)';
    deadlineSection.append(deadlineHeading);

    const list = document.createElement('div');
    list.className = 'deadline-list';

    for (const dl of data.upcomingDeadlines) {
      const item = document.createElement('div');
      item.className = 'deadline-item';

      const nameEl = document.createElement('span');
      nameEl.className = 'deadline-item__name';
      nameEl.textContent = dl.projectName;

      const dateEl = document.createElement('span');
      dateEl.className = 'deadline-item__date';
      dateEl.textContent = new Date(dl.deadline).toLocaleDateString();

      const daysEl = document.createElement('span');
      daysEl.className = `deadline-item__days ${dl.daysRemaining <= 30 ? 'is-urgent' : ''}`;
      daysEl.textContent = dl.daysRemaining > 0 ? `${dl.daysRemaining} days` : 'Overdue';

      const progressText = document.createElement('span');
      progressText.className = 'text-muted';
      progressText.textContent = `${dl.completeSections}/${dl.totalSections} sections complete`;
      progressText.style.fontSize = 'var(--font-size-sm)';

      item.append(nameEl, dateEl, daysEl, progressText);
      list.append(item);
    }

    deadlineSection.append(list);
    container.append(deadlineSection);
  }

  return container;
}
