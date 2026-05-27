/**
 * Dashboard API route.
 * Traces: REQ-003 -- Dashboard Overview
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

async function loadJson(filename) {
  try {
    const raw = await readFile(join(DATA_DIR, filename), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function getDashboard(req, res) {
  const meetings = await loadJson('meetings.json');
  const actionItems = await loadJson('action-items.json');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Overdue: open or in-progress items with past due dates
  const overdueItems = actionItems.filter((ai) => {
    if (ai.status === 'done') return false;
    if (!ai.dueDate) return false;
    return new Date(ai.dueDate) < today;
  }).length;

  // Recent meetings: sorted by date descending, max 5
  const recentMeetings = [...meetings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Upcoming action items: open/in-progress, sorted by due date ascending
  const upcomingActionItems = actionItems
    .filter((ai) => ai.status !== 'done')
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  res.json({
    totalMeetings: meetings.length,
    totalActionItems: actionItems.length,
    overdueItems,
    recentMeetings,
    upcomingActionItems,
  });
}

export function registerDashboardRoutes(router) {
  router.get('/dashboard', getDashboard);
}
