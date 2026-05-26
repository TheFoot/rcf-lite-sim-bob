import { get } from './services/api.mjs';

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status-message');

  try {
    const data = await get('/health');
    statusEl.textContent = `Server is healthy -- responded at ${data.timestamp}`;
    statusEl.classList.remove('text-muted');
    statusEl.style.color = 'var(--color-accent)';
  } catch (err) {
    statusEl.textContent = `Health check failed: ${err.message}`;
    statusEl.style.color = '#e53e3e';
  }
});
