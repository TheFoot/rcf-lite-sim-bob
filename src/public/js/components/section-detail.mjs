/**
 * Detail component for Section with workflow actions.
 */

export function createSectionDetail({ item, onStatusChange, onEdit, onDelete, renderMarkdown } = {}) {
  const container = document.createElement('section');
  container.className = 'section-detail';

  const heading = document.createElement('h2');
  heading.textContent = item.name || 'Section Detail';

  const statusBadge = document.createElement('span');
  statusBadge.className = `badge badge--${item.status || 'draft'}`;
  statusBadge.textContent = (item.status || 'draft').replace(/-/g, ' ');
  statusBadge.style.marginLeft = 'var(--space-md)';

  const headingRow = document.createElement('div');
  headingRow.style.display = 'flex';
  headingRow.style.alignItems = 'center';
  headingRow.style.gap = 'var(--space-md)';
  headingRow.style.marginBottom = 'var(--space-lg)';
  headingRow.append(heading, statusBadge);

  // Approval info
  const metaSection = document.createElement('div');
  metaSection.className = 'section-detail__meta';
  if (item.approvedBy) {
    const approverInfo = document.createElement('p');
    approverInfo.className = 'text-muted';
    const date = item.approvedAt ? new Date(item.approvedAt).toLocaleString() : '';
    approverInfo.textContent = `Approved by ${item.approvedBy}${date ? ` on ${date}` : ''}`;
    metaSection.append(approverInfo);
  }

  // Content (rendered markdown)
  const contentSection = document.createElement('div');
  contentSection.className = 'section-detail__content markdown-content';
  if (renderMarkdown && item.content) {
    renderMarkdown(contentSection, item.content);
  } else {
    contentSection.textContent = item.content || 'No content.';
  }

  // Workflow actions
  const workflowActions = document.createElement('div');
  workflowActions.className = 'section-detail__workflow';

  const status = item.status || 'draft';

  if (status === 'draft') {
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit for Review';
    submitBtn.addEventListener('click', () => onStatusChange && onStatusChange('in-review'));
    workflowActions.append(submitBtn);
  }

  if (status === 'in-review') {
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn--success';
    approveBtn.textContent = 'Approve';
    approveBtn.addEventListener('click', () => {
      const approver = prompt('Approver name:');
      if (approver) onStatusChange && onStatusChange('approved', approver);
    });

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn--warning';
    rejectBtn.textContent = 'Send Back to Draft';
    rejectBtn.addEventListener('click', () => onStatusChange && onStatusChange('draft'));

    workflowActions.append(approveBtn, rejectBtn);
  }

  if (status === 'approved') {
    const lockBtn = document.createElement('button');
    lockBtn.className = 'btn btn--danger';
    lockBtn.textContent = 'Lock';
    lockBtn.addEventListener('click', () => {
      if (confirm('Lock this section? It will become read-only.')) {
        onStatusChange && onStatusChange('locked');
      }
    });
    workflowActions.append(lockBtn);
  }

  // Edit/Delete actions (not available for locked sections)
  const actions = document.createElement('div');
  actions.className = 'section-detail__actions';

  if (status !== 'locked') {
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-secondary';
    editButton.textContent = 'Edit Content';
    editButton.addEventListener('click', () => { if (onEdit) onEdit(item); });
    actions.append(editButton);
  }

  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn--danger';
  deleteButton.textContent = 'Remove from Project';
  deleteButton.addEventListener('click', () => {
    if (confirm('Remove this section from the project?')) {
      if (onDelete) onDelete(item);
    }
  });
  actions.append(deleteButton);

  container.append(headingRow, metaSection, contentSection, workflowActions, actions);
  return container;
}
