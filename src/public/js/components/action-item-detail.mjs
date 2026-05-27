/**
 * Detail component for ActionItem.
 * Traces: REQ-002
 */

export function createActionItemDetail({ item, meetingTitle, onEdit, onDelete, onStatusChange } = {}) {
  const container = document.createElement('section');
  container.className = 'action-item-detail';

  // Breadcrumb navigation
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
  meetingLink.href = `/meetings/${item.meetingId}`;
  meetingLink.setAttribute('data-link', '');
  meetingLink.textContent = meetingTitle || 'Meeting';
  const sep2 = document.createElement('span');
  sep2.textContent = ' / ';
  sep2.className = 'breadcrumb__separator';
  const current = document.createElement('span');
  current.textContent = item.title || 'Action Item';
  current.className = 'breadcrumb__current';
  breadcrumb.append(meetingsLink, sep1, meetingLink, sep2, current);

  const heading = document.createElement('h2');
  heading.textContent = item.title || 'Action Item Detail';

  const statusRow = document.createElement('div');
  statusRow.className = 'action-item-detail__row';
  const statusLabel = document.createElement('strong');
  statusLabel.textContent = 'Status: ';
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge badge--${item.status || 'open'}`;
  statusBadge.textContent = item.status || 'open';
  statusRow.append(statusLabel, statusBadge);

  const assigneeRow = document.createElement('div');
  assigneeRow.className = 'action-item-detail__row';
  const assigneeLabel = document.createElement('strong');
  assigneeLabel.textContent = 'Assignee: ';
  const assigneeValue = document.createElement('span');
  assigneeValue.textContent = item.assignee || 'Unassigned';
  assigneeRow.append(assigneeLabel, assigneeValue);

  const dueDateRow = document.createElement('div');
  dueDateRow.className = 'action-item-detail__row';
  const dueDateLabel = document.createElement('strong');
  dueDateLabel.textContent = 'Due Date: ';
  const dueDateValue = document.createElement('span');
  dueDateValue.textContent = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date';
  dueDateRow.append(dueDateLabel, dueDateValue);

  // Quick status change buttons
  const statusActions = document.createElement('div');
  statusActions.className = 'action-item-detail__status-actions';
  const statusHeading = document.createElement('strong');
  statusHeading.textContent = 'Change status: ';
  statusActions.append(statusHeading);

  for (const st of ['open', 'in-progress', 'done']) {
    if (st !== item.status) {
      const btn = document.createElement('button');
      btn.className = `btn btn--status-${st}`;
      btn.textContent = st;
      btn.addEventListener('click', () => { if (onStatusChange) onStatusChange(st); });
      statusActions.append(btn);
    }
  }

  const actions = document.createElement('div');
  actions.className = 'action-item-detail__actions';

  const editButton = document.createElement('button');
  editButton.className = 'btn btn-primary';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => { if (onEdit) onEdit(item); });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn--danger';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this action item?')) {
      if (onDelete) onDelete(item);
    }
  });

  actions.append(editButton, deleteButton);
  container.append(breadcrumb, heading, statusRow, assigneeRow, dueDateRow, statusActions, actions);
  return container;
}
