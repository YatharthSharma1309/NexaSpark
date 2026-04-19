/** Change if the API runs on another host/port. */
const API_BASE = 'http://127.0.0.1:4000';

const btn = document.getElementById('health-check');
const out = document.getElementById('health-output');

btn?.addEventListener('click', async () => {
  if (!out) return;
  out.hidden = false;
  out.textContent = 'Loading…';
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent =
      err instanceof Error ? err.message : 'Request failed. Is the API running?';
  }
});
