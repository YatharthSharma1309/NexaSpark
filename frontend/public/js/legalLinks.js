import { API_BASE } from './api.js';

/**
 * Applies deploy-time legal URLs from GET /api/public/config.
 * Expects `a[data-legal="privacy"]` and `a[data-legal="terms"]` when present.
 */
export async function applyLegalFooterLinks() {
  const privacy = document.querySelector('a[data-legal="privacy"]');
  const terms = document.querySelector('a[data-legal="terms"]');
  if (!privacy && !terms) return;
  try {
    const res = await fetch(`${API_BASE}/api/public/config`);
    if (!res.ok) return;
    /** @type {{ privacyPolicyUrl?: string | null; termsOfServiceUrl?: string | null }} */
    const data = await res.json();
    if (privacy && data.privacyPolicyUrl) privacy.href = data.privacyPolicyUrl;
    if (terms && data.termsOfServiceUrl) terms.href = data.termsOfServiceUrl;
  } catch {
    // Keep defaults from HTML
  }
}
