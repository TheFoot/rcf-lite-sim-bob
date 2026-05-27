/**
 * Detail component for Meeting.
 * Traces: REQ-001
 */

export function createMeetingDetail({ item, onEdit, onDelete } = {}) {
  const container = document.createElement('section');
  container.className = 'meeting-detail';

  // Breadcrumb navigation
  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  const homeLink = document.createElement('a');
  homeLink.href = '/meetings';
  homeLink.setAttribute('data-link', '');
  homeLink.textContent = 'Meetings';
  const separator = document.createElement('span');
  separator.textContent = ' / ';
  separator.className = 'breadcrumb__separator';
  const current = document.createElement('span');
  current.textContent = item.title || 'Meeting Detail';
  current.className = 'breadcrumb__current';
  breadcrumb.append(homeLink, separator, current);

  const heading = document.createElement('h2');
  heading.textContent = item.title || 'Meeting Detail';

  const dateRow = document.createElement('div');
  dateRow.className = 'meeting-detail__row';
  const dateLabel = document.createElement('strong');
  dateLabel.textContent = 'Date: ';
  const dateValue = document.createElement('span');
  dateValue.textContent = item.date ? new Date(item.date).toLocaleDateString() : 'No date';
  dateRow.append(dateLabel, dateValue);

  const attendeesRow = document.createElement('div');
  attendeesRow.className = 'meeting-detail__row';
  const attendeesLabel = document.createElement('strong');
  attendeesLabel.textContent = 'Attendees: ';
  const attendeesValue = document.createElement('span');
  attendeesValue.textContent = item.attendees || 'None';
  attendeesRow.append(attendeesLabel, attendeesValue);

  const notesRow = document.createElement('div');
  notesRow.className = 'meeting-detail__row meeting-detail__notes';
  const notesLabel = document.createElement('strong');
  notesLabel.textContent = 'Notes: ';
  const notesValue = document.createElement('p');
  notesValue.textContent = item.notes || 'No notes recorded.';
  notesValue.style.whiteSpace = 'pre-wrap';
  notesRow.append(notesLabel, notesValue);

  const actions = document.createElement('div');
  actions.className = 'meeting-detail__actions';

  const editButton = document.createElement('button');
  editButton.className = 'btn btn-primary';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => { if (onEdit) onEdit(item); });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn--danger';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      if (onDelete) onDelete(item);
    }
  });

  actions.append(editButton, deleteButton);
  container.append(breadcrumb, heading, dateRow, attendeesRow, notesRow, actions);
  return container;
}
