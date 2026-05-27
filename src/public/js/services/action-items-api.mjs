/**
 * API client for action items.
 * Traces: REQ-002
 */

const BASE = '/api/v1';

export async function fetchActionItems(meetingId) {
  const url = meetingId
    ? `${BASE}/action-items?meetingId=${encodeURIComponent(meetingId)}`
    : `${BASE}/action-items`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch action items: ${res.status}`);
  return res.json();
}

export async function fetchActionItem(id) {
  const res = await fetch(`${BASE}/action-items/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch action item: ${res.status}`);
  return res.json();
}

export async function createActionItem(data) {
  const res = await fetch(`${BASE}/action-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create action item: ${res.status}`);
  return res.json();
}

export async function updateActionItem(id, data) {
  const res = await fetch(`${BASE}/action-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update action item: ${res.status}`);
  return res.json();
}

export async function deleteActionItem(id) {
  const res = await fetch(`${BASE}/action-items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete action item: ${res.status}`);
}
