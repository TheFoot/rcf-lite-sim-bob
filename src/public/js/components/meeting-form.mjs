/**
 * Form component for Meeting.
 * Traces: REQ-001
 */

export function createMeetingForm({ item, onSubmit } = {}) {
  const form = document.createElement('form');
  form.className = 'meeting-form';

  // Title field
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Title';
  titleLabel.setAttribute('for', 'title');
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.name = 'title';
  titleInput.id = 'title';
  titleInput.required = true;
  titleInput.placeholder = 'e.g. Sprint Planning';
  if (item && item.title) titleInput.value = item.title;
  const titleGroup = document.createElement('div');
  titleGroup.className = 'form-group';
  titleGroup.append(titleLabel, titleInput);

  // Date field
  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Date';
  dateLabel.setAttribute('for', 'date');
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.name = 'date';
  dateInput.id = 'date';
  dateInput.required = true;
  if (item && item.date) dateInput.value = item.date;
  const dateGroup = document.createElement('div');
  dateGroup.className = 'form-group';
  dateGroup.append(dateLabel, dateInput);

  // Attendees field
  const attendeesLabel = document.createElement('label');
  attendeesLabel.textContent = 'Attendees (comma-separated)';
  attendeesLabel.setAttribute('for', 'attendees');
  const attendeesInput = document.createElement('input');
  attendeesInput.type = 'text';
  attendeesInput.name = 'attendees';
  attendeesInput.id = 'attendees';
  attendeesInput.placeholder = 'e.g. Alice, Bob, Carol';
  if (item && item.attendees) attendeesInput.value = item.attendees;
  const attendeesGroup = document.createElement('div');
  attendeesGroup.className = 'form-group';
  attendeesGroup.append(attendeesLabel, attendeesInput);

  // Notes field
  const notesLabel = document.createElement('label');
  notesLabel.textContent = 'Notes';
  notesLabel.setAttribute('for', 'notes');
  const notesInput = document.createElement('textarea');
  notesInput.name = 'notes';
  notesInput.id = 'notes';
  notesInput.rows = 6;
  notesInput.placeholder = 'Meeting notes...';
  if (item && item.notes) notesInput.value = item.notes;
  const notesGroup = document.createElement('div');
  notesGroup.className = 'form-group';
  notesGroup.append(notesLabel, notesInput);

  // Buttons
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'button-group';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn btn-primary';
  submitButton.textContent = item ? 'Update Meeting' : 'Create Meeting';

  const cancelButton = document.createElement('a');
  cancelButton.className = 'btn btn-secondary';
  cancelButton.textContent = 'Cancel';
  cancelButton.href = item ? `/meetings/${item.id}` : '/meetings';
  cancelButton.setAttribute('data-link', '');

  buttonGroup.append(submitButton, cancelButton);

  form.append(titleGroup, dateGroup, attendeesGroup, notesGroup, buttonGroup);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      title: form.querySelector('[name="title"]').value,
      date: form.querySelector('[name="date"]').value,
      attendees: form.querySelector('[name="attendees"]').value,
      notes: form.querySelector('[name="notes"]').value,
    };
    if (!data.title || !data.title.trim()) { alert('Title is required.'); return; }
    if (!data.date) { alert('Date is required.'); return; }
    if (onSubmit) onSubmit(data);
  });

  return form;
}
