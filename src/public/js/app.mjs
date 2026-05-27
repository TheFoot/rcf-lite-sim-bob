import { initRouter, registerRoute, navigate } from './router.mjs';
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject } from './services/projects-api.mjs';
import { createProjectCard } from './components/project-card.mjs';
import { createProjectForm } from './components/project-form.mjs';
import { createProjectDetail } from './components/project-detail.mjs';
import { fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate } from './services/templates-api.mjs';
import { createTemplateCard } from './components/template-card.mjs';
import { createTemplateForm } from './components/template-form.mjs';
import { createTemplateDetail } from './components/template-detail.mjs';
import { renderMarkdownInto } from './markdown.mjs';

// ---------------------------------------------------------------------------
// Route: Dashboard (/)
// ---------------------------------------------------------------------------

registerRoute('/', async (container) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<h2>Dashboard</h2><p class="text-muted">Loading dashboard data...</p>';
  container.append(section);

  try {
    const projects = await fetchProjects();
    section.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Dashboard';
    section.append(heading);

    if (projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No projects yet. Create your first project to get started.';
      section.append(empty);

      const createBtn = document.createElement('a');
      createBtn.href = '/projects/new';
      createBtn.setAttribute('data-link', '');
      createBtn.className = 'btn btn-primary';
      createBtn.textContent = 'Create First Project';
      section.append(createBtn);
    } else {
      const summary = document.createElement('p');
      summary.className = 'text-muted';
      summary.textContent = `${projects.length} project${projects.length !== 1 ? 's' : ''} in the system.`;
      section.append(summary);

      const grid = document.createElement('div');
      grid.className = 'grid grid--2';
      grid.style.marginTop = 'var(--space-lg)';
      for (const project of projects) {
        const card = createProjectCard(project);
        card.addEventListener('click', () => navigate(`/projects/${project.id}`));
        grid.append(card);
      }
      section.append(grid);
    }
  } catch (err) {
    section.innerHTML = `<h2>Dashboard</h2><p style="color: var(--color-error);">Failed to load: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Projects list (/projects)
// ---------------------------------------------------------------------------

registerRoute('/projects', async (container) => {
  const section = document.createElement('section');
  section.className = 'card';
  container.append(section);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = 'var(--space-lg)';

  const heading = document.createElement('h2');
  heading.textContent = 'Projects';

  const newBtn = document.createElement('a');
  newBtn.href = '/projects/new';
  newBtn.setAttribute('data-link', '');
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = '+ New Project';

  header.append(heading, newBtn);
  section.append(header);

  try {
    const projects = await fetchProjects();
    if (projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No projects yet. Create your first project to get started.';
      section.append(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid--2';
      for (const project of projects) {
        const card = createProjectCard(project);
        card.addEventListener('click', () => navigate(`/projects/${project.id}`));
        grid.append(card);
      }
      section.append(grid);
    }
  } catch (err) {
    const errMsg = document.createElement('p');
    errMsg.style.color = 'var(--color-error)';
    errMsg.textContent = `Failed to load projects: ${err.message}`;
    section.append(errMsg);
  }
});

// ---------------------------------------------------------------------------
// Route: New project (/projects/new)
// ---------------------------------------------------------------------------

registerRoute('/projects/new', (container) => {
  const section = document.createElement('section');
  section.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = 'Create New Project';
  heading.style.marginBottom = 'var(--space-lg)';
  section.append(heading);

  const form = createProjectForm({
    onSubmit: async (data) => {
      try {
        await createProject(data);
        navigate('/projects');
      } catch (err) {
        alert(`Failed to create project: ${err.message}`);
      }
    },
  });
  section.append(form);
  container.append(section);
});

// ---------------------------------------------------------------------------
// Route: Project detail (/projects/:id)
// ---------------------------------------------------------------------------

registerRoute('/projects/:id', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading project...</p>';
  container.append(section);

  try {
    const project = await fetchProject(params.id);
    section.innerHTML = '';

    const detail = createProjectDetail({
      item: project,
      onEdit: () => navigate(`/projects/${project.id}/edit`),
      onDelete: async () => {
        try {
          await deleteProject(project.id);
          navigate('/projects');
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
        }
      },
    });
    section.append(detail);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Project not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Edit project (/projects/:id/edit)
// ---------------------------------------------------------------------------

registerRoute('/projects/:id/edit', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading...</p>';
  container.append(section);

  try {
    const project = await fetchProject(params.id);
    section.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Edit Project';
    heading.style.marginBottom = 'var(--space-lg)';
    section.append(heading);

    const form = createProjectForm({
      item: project,
      onSubmit: async (data) => {
        try {
          await updateProject(project.id, data);
          navigate(`/projects/${project.id}`);
        } catch (err) {
          alert(`Failed to update: ${err.message}`);
        }
      },
    });
    section.append(form);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Project not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Templates list (/templates)
// ---------------------------------------------------------------------------

registerRoute('/templates', async (container) => {
  const section = document.createElement('section');
  section.className = 'card';
  container.append(section);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = 'var(--space-lg)';

  const heading = document.createElement('h2');
  heading.textContent = 'Section Templates';

  const newBtn = document.createElement('a');
  newBtn.href = '/templates/new';
  newBtn.setAttribute('data-link', '');
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = '+ New Template';

  header.append(heading, newBtn);
  section.append(header);

  try {
    const templates = await fetchTemplates();
    if (templates.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No templates yet. Create your first template to get started.';
      section.append(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid--2';
      for (const template of templates) {
        const card = createTemplateCard(template);
        card.addEventListener('click', () => navigate(`/templates/${template.id}`));
        grid.append(card);
      }
      section.append(grid);
    }
  } catch (err) {
    const errMsg = document.createElement('p');
    errMsg.style.color = 'var(--color-error)';
    errMsg.textContent = `Failed to load templates: ${err.message}`;
    section.append(errMsg);
  }
});

// ---------------------------------------------------------------------------
// Route: New template (/templates/new)
// ---------------------------------------------------------------------------

registerRoute('/templates/new', (container) => {
  const section = document.createElement('section');
  section.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = 'Create New Template';
  heading.style.marginBottom = 'var(--space-lg)';
  section.append(heading);

  const form = createTemplateForm({
    onSubmit: async (data) => {
      try {
        await createTemplate(data);
        navigate('/templates');
      } catch (err) {
        alert(`Failed to create template: ${err.message}`);
      }
    },
  });
  section.append(form);
  container.append(section);
});

// ---------------------------------------------------------------------------
// Route: Template detail (/templates/:id)
// ---------------------------------------------------------------------------

registerRoute('/templates/:id', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading template...</p>';
  container.append(section);

  try {
    const template = await fetchTemplate(params.id);
    section.innerHTML = '';

    const detail = createTemplateDetail({
      item: template,
      renderMarkdown: renderMarkdownInto,
      onEdit: () => navigate(`/templates/${template.id}/edit`),
      onDelete: async () => {
        try {
          await deleteTemplate(template.id);
          navigate('/templates');
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
        }
      },
    });
    section.append(detail);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Template not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Edit template (/templates/:id/edit)
// ---------------------------------------------------------------------------

registerRoute('/templates/:id/edit', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = '<p class="text-muted">Loading...</p>';
  container.append(section);

  try {
    const template = await fetchTemplate(params.id);
    section.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Edit Template';
    heading.style.marginBottom = 'var(--space-lg)';
    section.append(heading);

    const form = createTemplateForm({
      item: template,
      onSubmit: async (data) => {
        try {
          await updateTemplate(template.id, data);
          navigate(`/templates/${template.id}`);
        } catch (err) {
          alert(`Failed to update: ${err.message}`);
        }
      },
    });
    section.append(form);
  } catch (err) {
    section.innerHTML = `<p style="color: var(--color-error);">Template not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  initRouter(appContainer);
});
