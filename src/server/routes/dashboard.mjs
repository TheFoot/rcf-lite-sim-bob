/**
 * Dashboard aggregation endpoint.
 * Reads projects and sections to compute summaries.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

async function loadJSON(filename) {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, filename), 'utf8'));
  } catch {
    return [];
  }
}

async function getDashboard(_req, res) {
  const [projects, sections] = await Promise.all([
    loadJSON('projects.json'),
    loadJSON('sections.json'),
  ]);

  // Project summaries with completion percentages
  const projectSummaries = projects.map((project) => {
    const projectSections = sections.filter((s) => s.projectId === project.id);
    const total = projectSections.length;
    const complete = projectSections.filter((s) => s.status === 'approved' || s.status === 'locked').length;
    const completionPercent = total > 0 ? Math.round((complete / total) * 100 * 10) / 10 : 0;

    const statusCounts = { draft: 0, 'in-review': 0, approved: 0, locked: 0 };
    for (const s of projectSections) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      deadline: project.deadline,
      team: project.team,
      status: project.status,
      totalSections: total,
      completionPercent,
      statusCounts,
    };
  });

  // Blocking sections (draft or in-review)
  const blockingSections = sections
    .filter((s) => s.status === 'draft' || s.status === 'in-review')
    .map((s) => {
      const project = projects.find((p) => p.id === s.projectId);
      return {
        id: s.id,
        name: s.name,
        status: s.status,
        projectId: s.projectId,
        projectName: project?.name || 'Unknown Project',
        order: s.order,
      };
    });

  // Recent activity (approved/locked sections with timestamps)
  const recentActivity = sections
    .filter((s) => s.approvedBy && s.approvedAt)
    .map((s) => {
      const project = projects.find((p) => p.id === s.projectId);
      return {
        sectionId: s.id,
        sectionName: s.name,
        status: s.status,
        approvedBy: s.approvedBy,
        approvedAt: s.approvedAt,
        projectId: s.projectId,
        projectName: project?.name || 'Unknown Project',
      };
    })
    .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
    .slice(0, 20);

  // Upcoming deadlines sorted by urgency
  const upcomingDeadlines = projects
    .filter((p) => p.deadline && p.status === 'active')
    .map((p) => {
      const projectSections = sections.filter((s) => s.projectId === p.id);
      const total = projectSections.length;
      const complete = projectSections.filter((s) => s.status === 'approved' || s.status === 'locked').length;
      return {
        projectId: p.id,
        projectName: p.name,
        deadline: p.deadline,
        totalSections: total,
        completeSections: complete,
        daysRemaining: Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  res.json({
    projects: projectSummaries,
    blockingSections,
    recentActivity,
    upcomingDeadlines,
  });
}

export function registerDashboardRoutes(router) {
  router.get('/dashboard', getDashboard);
}
