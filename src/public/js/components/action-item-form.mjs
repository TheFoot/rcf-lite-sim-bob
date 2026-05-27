/**
 * Form component for ActionItem.
 * Traces: REQ-002
 */

export function createActionItemForm({ item, meetingId, onSubmit } = {}) {
  const form = document.createElement('form');
  form.className = 'action-item-form';

  // Title
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Title';
  titleLabel.setAttribute('for', 'ai-title');
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.name = 'title';
  titleInput.id = 'ai-title';
  titleInput.required = true;
  titleInput.placeholder = 'e.g. Review design documents';
  if (item && item.title) titleInput.value = item.title;
  const titleGroup = document.createElement('div');
  titleGroup.className = 'form-group';
  titleGroup.append(titleLabel, titleInput);

  // Assignee
  const assigneeLabel = document.createElement('label');
  assigneeLabel.textContent = 'Assignee';
  assigneeLabel.setAttribute('for', 'ai-assignee');
  const assigneeInput = document.createElement('input');
  assigneeInput.type = 'text';
  assigneeInput.name = 'assignee';
  assigneeInput.id = 'ai-assignee';
  assigneeInput.placeholder = 'e.g. Alice Chen';
  if (item && item.assignee) assigneeInput.value = item.assignee;
  const assigneeGroup = document.createElement('div');
  assigneeGroup.className = 'form-group';
  assigneeGroup.append(assigneeLabel, assigneeInput);

  // Due Date
  const dueDateLabel = document.createElement('label');
  dueDateLabel.textContent = 'Due Date';
  dueDateLabel.setAttribute('for', 'ai-dueDate');
  const dueDateInput = document.createElement('input');
  dueDateInput.type = 'date';
  dueDateInput.name = 'dueDate';
  dueDateInput.id = 'ai-dueDate';
  if (item && item.dueDate) dueDateInput.value = item.dueDate;
  const dueDateGroup = document.createElement('div');
  dueDateGroup.className = 'form-group';
  dueDateGroup.append(dueDateLabel, dueDateInput);

  // Status
  const statusLabel = document.createElement('label');
  statusLabel.textContent = 'Status';
  statusLabel.setAttribute('for', 'ai-status');
  const statusSelect = document.createElement('select');
  statusSelect.name = 'status';
  statusSelect.id = 'ai-status';
  for (const opt of ['open', 'in-progress', 'done']) {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    statusSelect.append(option);
  }
  if (item && item.status) statusSelect.value = item.status;
  const statusGroup = document.createElement('div');
  statusGroup.className = 'form-group';
  statusGroup.append(statusLabel, statusSelect);

  // Buttons
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'button-group';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn btn-primary';
  submitButton.textContent = item ? 'Update Action Item' : 'Create Action Item';

  const cancelButton = document.createElement('a');
  cancelButton.className = 'btn btn-secondary';
  cancelButton.textContent = 'Cancel';
  const mid = item ? item.meetingId : meetingId;
  cancelButton.href = item ? `/action-items/${item.id}` : `/meetings/${mid}`;
  cancelButton.setAttribute('data-link', '');

  buttonGroup.append(submitButton, cancelButton);

  form.append(titleGroup, assigneeGroup, dueDateGroup, statusGroup, buttonGroup);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      title: form.querySelector('[name="title"]').value,
      meetingId: item ? item.meetingId : meetingId,
      assignee: form.querySelector('[name="assignee"]').value,
      dueDate: form.querySelector('[name="dueDate"]').value,
      status: form.querySelector('[name="status"]').value,
    };
    if (!data.title || !data.title.trim()) { alert('Title is required.'); return; }
    if (onSubmit) onSubmit(data);
  });

  return form;
}
