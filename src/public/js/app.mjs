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
import { fetchSections, fetchSection, createSection, updateSection, deleteSection, transitionSectionStatus } from './services/sections-api.mjs';
import { createSectionCard } from './components/section-card.mjs';
import { createSectionDetail } from './components/section-detail.mjs';
import { createDashboardView } from './components/dashboard-view.mjs';

// ---------------------------------------------------------------------------
// Route: Dashboard (/)
// ---------------------------------------------------------------------------

registerRoute('/', async (container) => {
  const loading = document.createElement('section');
  loading.className = 'card';
  loading.innerHTML = '<h2>Dashboard</h2><p class="text-muted">Loading dashboard data...</p>';
  container.append(loading);

  try {
    const res = await fetch('/api/v1/dashboard');
    if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
    const data = await res.json();

    container.innerHTML = '';
    const dashboardView = createDashboardView(data, {
      onProjectClick: (id) => navigate(`/projects/${id}`),
    });
    container.append(dashboardView);
  } catch (err) {
    container.innerHTML = `<section class="card"><h2>Dashboard</h2><p style="color: var(--color-error);">Failed to load: ${err.message}</p></section>`;
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

    // Sections panel
    const sectionsPanel = document.createElement('section');
    sectionsPanel.className = 'card';
    sectionsPanel.style.marginTop = 'var(--space-lg)';
    container.append(sectionsPanel);

    const sectionsHeader = document.createElement('div');
    sectionsHeader.style.display = 'flex';
    sectionsHeader.style.justifyContent = 'space-between';
    sectionsHeader.style.alignItems = 'center';
    sectionsHeader.style.marginBottom = 'var(--space-lg)';

    const sectionsHeading = document.createElement('h2');
    sectionsHeading.textContent = 'Sections';

    const addSectionBtn = document.createElement('a');
    addSectionBtn.href = `/projects/${project.id}/add-section`;
    addSectionBtn.setAttribute('data-link', '');
    addSectionBtn.className = 'btn btn-primary';
    addSectionBtn.textContent = '+ Add Section';

    sectionsHeader.append(sectionsHeading, addSectionBtn);
    sectionsPanel.append(sectionsHeader);

    const sections = await fetchSections(project.id);
    if (sections.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No sections yet. Add a section from the template library.';
      sectionsPanel.append(empty);
    } else {
      const sectionsList = document.createElement('div');
      sectionsList.className = 'sections-list';
      for (const s of sections.sort((a, b) => (a.order || 0) - (b.order || 0))) {
        const card = createSectionCard(s);
        card.addEventListener('click', () => navigate(`/sections/${s.id}`));
        sectionsList.append(card);
      }
      sectionsPanel.append(sectionsList);
    }
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
// Route: Add section to project (/projects/:id/add-section)
// ---------------------------------------------------------------------------

registerRoute('/projects/:id/add-section', async (container, params) => {
  const section = document.createElement('section');
  section.className = 'card';
  container.append(section);

  const heading = document.createElement('h2');
  heading.textContent = 'Add Section from Template';
  heading.style.marginBottom = 'var(--space-lg)';
  section.append(heading);

  try {
    const templates = await fetchTemplates();
    if (templates.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No templates available. Create templates first.';
      section.append(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid--2';
      for (const template of templates) {
        const card = createTemplateCard(template);
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary';
        addBtn.textContent = 'Add to Project';
        addBtn.style.marginTop = 'var(--space-sm)';
        addBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await createSection({ projectId: params.id, templateId: template.id });
            navigate(`/projects/${params.id}`);
          } catch (err) {
            alert(`Failed to add section: ${err.message}`);
          }
        });
        card.append(addBtn);
        card.style.cursor = 'default';
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
// Route: Section detail (/sections/:id)
// ---------------------------------------------------------------------------

registerRoute('/sections/:id', async (container, params) => {
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = '<p class="text-muted">Loading section...</p>';
  container.append(card);

  try {
    const sectionData = await fetchSection(params.id);
    card.innerHTML = '';

    const detail = createSectionDetail({
      item: sectionData,
      renderMarkdown: renderMarkdownInto,
      onStatusChange: async (newStatus, approvedBy) => {
        try {
          await transitionSectionStatus(sectionData.id, newStatus, approvedBy);
          navigate(`/sections/${sectionData.id}`);
        } catch (err) {
          alert(`Status transition failed: ${err.message}`);
        }
      },
      onEdit: () => navigate(`/sections/${sectionData.id}/edit`),
      onDelete: async () => {
        try {
          await deleteSection(sectionData.id);
          navigate(`/projects/${sectionData.projectId}`);
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
        }
      },
    });
    card.append(detail);

    // Back to project link
    const backLink = document.createElement('a');
    backLink.href = `/projects/${sectionData.projectId}`;
    backLink.setAttribute('data-link', '');
    backLink.className = 'btn btn-secondary';
    backLink.textContent = 'Back to Project';
    backLink.style.marginTop = 'var(--space-lg)';
    backLink.style.display = 'inline-block';
    card.append(backLink);
  } catch (err) {
    card.innerHTML = `<p style="color: var(--color-error);">Section not found: ${err.message}</p>`;
  }
});

// ---------------------------------------------------------------------------
// Route: Edit section (/sections/:id/edit)
// ---------------------------------------------------------------------------

registerRoute('/sections/:id/edit', async (container, params) => {
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = '<p class="text-muted">Loading...</p>';
  container.append(card);

  try {
    const sectionData = await fetchSection(params.id);
    card.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = `Edit: ${sectionData.name}`;
    heading.style.marginBottom = 'var(--space-lg)';
    card.append(heading);

    const form = document.createElement('form');
    form.className = 'template-form';

    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Content (Markdown)';
    contentLabel.setAttribute('for', 'content');

    const contentArea = document.createElement('textarea');
    contentArea.name = 'content';
    contentArea.id = 'content';
    contentArea.rows = 16;
    contentArea.value = sectionData.content || '';

    const contentGroup = document.createElement('div');
    contentGroup.className = 'form-group';
    contentGroup.append(contentLabel, contentArea);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Save Changes';

    form.append(contentGroup, submitBtn);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await updateSection(sectionData.id, { content: contentArea.value });
        navigate(`/sections/${sectionData.id}`);
      } catch (err) {
        alert(`Failed to save: ${err.message}`);
      }
    });

    card.append(form);
  } catch (err) {
    card.innerHTML = `<p style="color: var(--color-error);">Section not found: ${err.message}</p>`;
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
