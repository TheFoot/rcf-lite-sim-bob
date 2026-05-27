/**
 * Minimal client-side router using History API.
 */

const routes = new Map();
let appContainer;

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  render();
}

export function render() {
  if (!appContainer) return;
  const path = window.location.pathname;

  // Try exact match first
  if (routes.has(path)) {
    appContainer.innerHTML = '';
    routes.get(path)(appContainer);
    return;
  }

  // Try pattern matches (e.g., /projects/:id)
  for (const [pattern, handler] of routes) {
    const params = matchRoute(pattern, path);
    if (params) {
      appContainer.innerHTML = '';
      handler(appContainer, params);
      return;
    }
  }

  // 404 fallback
  appContainer.innerHTML = '<section class="card"><h2>Page Not Found</h2><p>The page you are looking for does not exist.</p></section>';
}

function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function initRouter(container) {
  appContainer = container;

  // Intercept link clicks with data-link attribute
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-link]');
    if (link) {
      event.preventDefault();
      navigate(link.getAttribute('href'));
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', render);

  // Initial render
  render();
}
