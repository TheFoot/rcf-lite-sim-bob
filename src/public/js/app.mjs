/**
 * Meeting Notes -- SPA entry point.
 * Traces: REQ-001, REQ-002, REQ-003
 */

import { initRouter, registerRoute, navigate } from './router.mjs';
import { fetchMeetings, fetchMeeting, createMeeting, updateMeeting, deleteMeeting } from './services/meetings-api.mjs';
import { createMeetingCard } from './components/meeting-card.mjs';
import { createMeetingForm } from './components/meeting-form.mjs';
import { createMeetingDetail } from './components/meeting-detail.mjs';
import { fetchActionItems, fetchActionItem, createActionItem, updateActionItem, deleteActionItem } from './services/action-items-api.mjs';
import { createActionItemCard } from './components/action-item-card.mjs';
import { createActionItemDetail } from './components/action-item-detail.mjs';
import { createActionItemForm } from './components/action-item-form.mjs';
import { createDashboardView } from './components/dashboard-view.mjs';

// ---------------------------------------------------------------------------
// Route: Dashboard (/)
// ---------------------------------------------------------------------------

registerRoute('/', async (container) => {
  const loading = document.createElement('section');
  loading.className = 'card';
  loading.innerHTML = '<h2>Dashboard</h2><p class="text-muted">Loading...</p>';
  container.append(loading);

  try {
    const res = await fetch('/api/v1/dashboard');
    if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
    const data = await res.json();

    container.innerHTML = '';
    const dashboardView = createDashboardView(data, {
      onMeetingClick: (id) => navigate(`/meetings/${id}`),
      onActionItemClick: (id) => navigate(`/action-items/${id}`),
    });
    container.append(dashboardView);
  } catch (err) {
    container.innerHTML = `<section class="card"><h2>Dashboard</h2><p style="color: var(--color-error);">Failed to load: ${err.message}</p></section>`;
  }
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

    // Action Items panel
    const aiPanel = document.createElement('section');
    aiPanel.className = 'card';
    aiPanel.style.marginTop = 'var(--space-lg)';
    container.append(aiPanel);

    const aiHeader = document.createElement('div');
    aiHeader.style.display = 'flex';
    aiHeader.style.justifyContent = 'space-between';
    aiHeader.style.alignItems = 'center';
    aiHeader.style.marginBottom = 'var(--space-lg)';

    const aiHeading = document.createElement('h2');
    aiHeading.textContent = 'Action Items';

    const addAiBtn = document.createElement('a');
    addAiBtn.href = `/meetings/${meeting.id}/action-items/new`;
    addAiBtn.setAttribute('data-link', '');
    addAiBtn.className = 'btn btn-primary';
    addAiBtn.textContent = '+ Add Action Item';

    aiHeader.append(aiHeading, addAiBtn);
    aiPanel.append(aiHeader);

    const actionItems = await fetchActionItems(meeting.id);
    if (actionItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No action items yet. Add an action item to track follow-ups.';
      aiPanel.append(empty);
    } else {
      const aiList = document.createElement('div');
      aiList.className = 'action-items-list';
      for (const ai of actionItems) {
        const card = createActionItemCard(ai);
        card.addEventListener('click', () => navigate(`/action-items/${ai.id}`));
        aiList.append(card);
      }
      aiPanel.append(aiList);
    }
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
// Route: New action item (/meetings/:id/action-items/new)
// ---------------------------------------------------------------------------

registerRoute('/meetings/:id/action-items/new', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  container.append(section);

  let meetingTitle = 'Meeting';
  try {
    const meeting = await fetchMeeting(params.id);
    meetingTitle = meeting.title;
  } catch { /* use default */ }

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  const meetingsLink = document.createElement('a');
  meetingsLink.href = '/meetings';
  meetingsLink.setAttribute('data-link', '');
  meetingsLink.textContent = 'Meetings';
  const sep1 = document.createElement('span');
  sep1.textContent = ' / ';
  sep1.className = 'breadcrumb__separator';
  const meetingLink = document.createElement('a');
  meetingLink.href = `/meetings/${params.id}`;
  meetingLink.setAttribute('data-link', '');
  meetingLink.textContent = meetingTitle;
  const sep2 = document.createElement('span');
  sep2.textContent = ' / ';
  sep2.className = 'breadcrumb__separator';
  const cur = document.createElement('span');
  cur.textContent = 'New Action Item';
  cur.className = 'breadcrumb__current';
  breadcrumb.append(meetingsLink, sep1, meetingLink, sep2, cur);

  const heading = document.createElement('h2');
  heading.textContent = 'Add Action Item';
  heading.style.marginBottom = 'var(--space-lg)';

  section.append(breadcrumb, heading);

  const form = createActionItemForm({
    meetingId: params.id,
    onSubmit: async (data) => {
      try {
        await createActionItem(data);
        navigate(`/meetings/${params.id}`);
      } catch (err) {
        alert(`Failed to create action item: ${err.message}`);
      }
    },
  });
  section.append(form);
});

// ---------------------------------------------------------------------------
// Route: Action item detail (/action-items/:id)
// ---------------------------------------------------------------------------

registerRoute('/action-items/:id', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading action item...</p>';
  container.append(section);

  try {
    const actionItem = await fetchActionItem(params.id);
    let meetingTitle = 'Meeting';
    try {
      const meeting = await fetchMeeting(actionItem.meetingId);
      meetingTitle = meeting.title;
    } catch { /* use default */ }

    section.innerHTML = '';

    const detail = createActionItemDetail({
      item: actionItem,
      meetingTitle,
      onEdit: () => navigate(`/action-items/${actionItem.id}/edit`),
      onDelete: async () => {
        try {
          await deleteActionItem(actionItem.id);
          navigate(`/meetings/${actionItem.meetingId}`);
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
        }
      },
      onStatusChange: async (newStatus) => {
        try {
          await updateActionItem(actionItem.id, { ...actionItem, status: newStatus });
          navigate(`/action-items/${actionItem.id}`);
        } catch (err) {
          alert(`Failed to update status: ${err.message}`);
        }
      },
    });
    section.append(detail);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Action item not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Edit action item (/action-items/:id/edit)
// ---------------------------------------------------------------------------

registerRoute('/action-items/:id/edit', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading...</p>';
  container.append(section);

  try {
    const actionItem = await fetchActionItem(params.id);
    let meetingTitle = 'Meeting';
    try {
      const meeting = await fetchMeeting(actionItem.meetingId);
      meetingTitle = meeting.title;
    } catch { /* use default */ }

    section.innerHTML = '';

    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'breadcrumb';
    const meetingsLink = document.createElement('a');
    meetingsLink.href = '/meetings';
    meetingsLink.setAttribute('data-link', '');
    meetingsLink.textContent = 'Meetings';
    const sep1 = document.createElement('span');
    sep1.textContent = ' / ';
    sep1.className = 'breadcrumb__separator';
    const meetingLink = document.createElement('a');
    meetingLink.href = `/meetings/${actionItem.meetingId}`;
    meetingLink.setAttribute('data-link', '');
    meetingLink.textContent = meetingTitle;
    const sep2 = document.createElement('span');
    sep2.textContent = ' / ';
    sep2.className = 'breadcrumb__separator';
    const aiLink = document.createElement('a');
    aiLink.href = `/action-items/${actionItem.id}`;
    aiLink.setAttribute('data-link', '');
    aiLink.textContent = actionItem.title;
    const sep3 = document.createElement('span');
    sep3.textContent = ' / ';
    sep3.className = 'breadcrumb__separator';
    const cur = document.createElement('span');
    cur.textContent = 'Edit';
    cur.className = 'breadcrumb__current';
    breadcrumb.append(meetingsLink, sep1, meetingLink, sep2, aiLink, sep3, cur);

    const heading = document.createElement('h2');
    heading.textContent = 'Edit Action Item';
    heading.style.marginBottom = 'var(--space-lg)';

    section.append(breadcrumb, heading);

    const form = createActionItemForm({
      item: actionItem,
      onSubmit: async (data) => {
        try {
          await updateActionItem(actionItem.id, data);
          navigate(`/action-items/${actionItem.id}`);
        } catch (err) {
          alert(`Failed to update: ${err.message}`);
        }
      },
    });
    section.append(form);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Action item not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  initRouter(appContainer);
});
