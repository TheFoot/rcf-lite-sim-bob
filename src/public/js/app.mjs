/**
 * Meeting Notes -- SPA entry point.
 * Traces: REQ-001
 */

import { initRouter, registerRoute, navigate } from './router.mjs';
import { fetchMeetings, fetchMeeting, createMeeting, updateMeeting, deleteMeeting } from './services/meetings-api.mjs';
import { createMeetingCard } from './components/meeting-card.mjs';
import { createMeetingForm } from './components/meeting-form.mjs';
import { createMeetingDetail } from './components/meeting-detail.mjs';

// ---------------------------------------------------------------------------
// Route: Dashboard (/) -- placeholder until BS-003
// ---------------------------------------------------------------------------

registerRoute('/', async (container) => {
  const hero = document.createElement('section');
  hero.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = 'Welcome to Meeting Notes';
  heading.style.color = 'var(--color-accent)';

  const description = document.createElement('p');
  description.className = 'text-muted';
  description.textContent = 'Capture, organize, and track action items from team meetings.';

  const meetingsLink = document.createElement('a');
  meetingsLink.href = '/meetings';
  meetingsLink.setAttribute('data-link', '');
  meetingsLink.className = 'btn btn-primary';
  meetingsLink.textContent = 'View Meetings';
  meetingsLink.style.marginTop = 'var(--space-lg)';
  meetingsLink.style.display = 'inline-block';

  hero.append(heading, description, meetingsLink);
  container.append(hero);
});

// ---------------------------------------------------------------------------
// Route: Meetings list (/meetings)
// ---------------------------------------------------------------------------

registerRoute('/meetings', async (container) => {
  const section = document.createElement('section');
  section.className = 'card';
  container.append(section);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = 'var(--space-lg)';

  const heading = document.createElement('h2');
  heading.textContent = 'Meetings';

  const newBtn = document.createElement('a');
  newBtn.href = '/meetings/new';
  newBtn.setAttribute('data-link', '');
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = '+ New Meeting';

  header.append(heading, newBtn);
  section.append(header);

  try {
    const meetings = await fetchMeetings();
    if (meetings.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No meetings yet. Create your first meeting to get started.';
      section.append(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid--2';
      for (const meeting of meetings) {
        const card = createMeetingCard(meeting);
        card.addEventListener('click', () => navigate(`/meetings/${meeting.id}`));
        grid.append(card);
      }
      section.append(grid);
    }
  } catch (err) {
    const errMsg = document.createElement('p');
    errMsg.style.color = 'var(--color-error)';
    errMsg.textContent = `Failed to load meetings: ${err.message}`;
    section.append(errMsg);
  }
});

// ---------------------------------------------------------------------------
// Route: New meeting (/meetings/new)
// ---------------------------------------------------------------------------

registerRoute('/meetings/new', (container) => {
  const section = document.createElement('section');
  section.className = 'card';

  // Breadcrumb
  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  const backLink = document.createElement('a');
  backLink.href = '/meetings';
  backLink.setAttribute('data-link', '');
  backLink.textContent = 'Meetings';
  const sep = document.createElement('span');
  sep.textContent = ' / ';
  sep.className = 'breadcrumb__separator';
  const cur = document.createElement('span');
  cur.textContent = 'New Meeting';
  cur.className = 'breadcrumb__current';
  breadcrumb.append(backLink, sep, cur);

  const heading = document.createElement('h2');
  heading.textContent = 'Create New Meeting';
  heading.style.marginBottom = 'var(--space-lg)';

  section.append(breadcrumb, heading);

  const form = createMeetingForm({
    onSubmit: async (data) => {
      try {
        await createMeeting(data);
        navigate('/meetings');
      } catch (err) {
        alert(`Failed to create meeting: ${err.message}`);
      }
    },
  });
  section.append(form);
  container.append(section);
});

// ---------------------------------------------------------------------------
// Route: Meeting detail (/meetings/:id)
// ---------------------------------------------------------------------------

registerRoute('/meetings/:id', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading meeting...</p>';
  container.append(section);

  try {
    const meeting = await fetchMeeting(params.id);
    section.innerHTML = '';

    const detail = createMeetingDetail({
      item: meeting,
      onEdit: () => navigate(`/meetings/${meeting.id}/edit`),
      onDelete: async () => {
        try {
          await deleteMeeting(meeting.id);
          navigate('/meetings');
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
        }
      },
    });
    section.append(detail);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Meeting not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Edit meeting (/meetings/:id/edit)
// ---------------------------------------------------------------------------

registerRoute('/meetings/:id/edit', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading...</p>';
  container.append(section);

  try {
    const meeting = await fetchMeeting(params.id);
    section.innerHTML = '';

    // Breadcrumb
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'breadcrumb';
    const meetingsLink = document.createElement('a');
    meetingsLink.href = '/meetings';
    meetingsLink.setAttribute('data-link', '');
    meetingsLink.textContent = 'Meetings';
    const sep1 = document.createElement('span');
    sep1.textContent = ' / ';
    sep1.className = 'breadcrumb__separator';
    const detailLink = document.createElement('a');
    detailLink.href = `/meetings/${meeting.id}`;
    detailLink.setAttribute('data-link', '');
    detailLink.textContent = meeting.title;
    const sep2 = document.createElement('span');
    sep2.textContent = ' / ';
    sep2.className = 'breadcrumb__separator';
    const cur = document.createElement('span');
    cur.textContent = 'Edit';
    cur.className = 'breadcrumb__current';
    breadcrumb.append(meetingsLink, sep1, detailLink, sep2, cur);

    const heading = document.createElement('h2');
    heading.textContent = 'Edit Meeting';
    heading.style.marginBottom = 'var(--space-lg)';

    section.append(breadcrumb, heading);

    const form = createMeetingForm({
      item: meeting,
      onSubmit: async (data) => {
        try {
          await updateMeeting(meeting.id, data);
          navigate(`/meetings/${meeting.id}`);
        } catch (err) {
          alert(`Failed to update: ${err.message}`);
        }
      },
    });
    section.append(form);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Meeting not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  initRouter(appContainer);
});
