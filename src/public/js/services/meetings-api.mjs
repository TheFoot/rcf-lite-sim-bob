/**
 * API client for meetings.
 * Traces: REQ-001
 */

const BASE = '/api/v1';

export async function fetchMeetings() {
  const res = await fetch(`${BASE}/meetings`);
  if (!res.ok) throw new Error(`Failed to fetch meetings: ${res.status}`);
  return res.json();
}

export async function fetchMeeting(id) {
  const res = await fetch(`${BASE}/meetings/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch meeting: ${res.status}`);
  return res.json();
}

export async function createMeeting(data) {
  const res = await fetch(`${BASE}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create meeting: ${res.status}`);
  return res.json();
}

export async function updateMeeting(id, data) {
  const res = await fetch(`${BASE}/meetings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update meeting: ${res.status}`);
  return res.json();
}

export async function deleteMeeting(id) {
  const res = await fetch(`${BASE}/meetings/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete meeting: ${res.status}`);
}
