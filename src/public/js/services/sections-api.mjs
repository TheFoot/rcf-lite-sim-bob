/**
 * API client for sections (project working copies).
 */

const BASE = '/api/v1';

export async function fetchSections(projectId) {
  const url = projectId ? `${BASE}/sections?projectId=${projectId}` : `${BASE}/sections`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sections: ${res.status}`);
  return res.json();
}

export async function fetchSection(id) {
  const res = await fetch(`${BASE}/sections/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch section: ${res.status}`);
  return res.json();
}

export async function createSection(data) {
  const res = await fetch(`${BASE}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create section: ${res.status}`);
  return res.json();
}

export async function updateSection(id, data) {
  const res = await fetch(`${BASE}/sections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update section: ${res.status}`);
  return res.json();
}

export async function deleteSection(id) {
  const res = await fetch(`${BASE}/sections/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete section: ${res.status}`);
}

export async function transitionSectionStatus(id, status, approvedBy) {
  const body = { status };
  if (approvedBy) body.approvedBy = approvedBy;
  const res = await fetch(`${BASE}/sections/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || `Failed to transition status: ${res.status}`);
  }
  return res.json();
}
