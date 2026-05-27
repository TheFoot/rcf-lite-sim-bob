/**
 * Card component for Meeting.
 * Traces: REQ-001
 */

export function createMeetingCard(item) {
  const card = document.createElement('article');
  card.className = 'meeting-card';
  card.dataset.id = item.id;
  card.style.cursor = 'pointer';

  const titleElement = document.createElement('h3');
  titleElement.className = 'meeting-card__title';
  titleElement.textContent = item.title || '';

  const meta = document.createElement('div');
  meta.className = 'meeting-card__meta';

  const dateElement = document.createElement('span');
  dateElement.className = 'meeting-card__date';
  dateElement.textContent = item.date ? new Date(item.date).toLocaleDateString() : '';

  const attendeesElement = document.createElement('span');
  attendeesElement.className = 'meeting-card__attendees text-muted';
  const attendeeList = item.attendees ? item.attendees.split(',').map(a => a.trim()).filter(Boolean) : [];
  attendeesElement.textContent = attendeeList.length ? `${attendeeList.length} attendee${attendeeList.length !== 1 ? 's' : ''}` : 'No attendees';

  meta.append(dateElement, attendeesElement);
  card.append(titleElement, meta);
  return card;
}
