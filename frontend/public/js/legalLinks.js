import { API_BASE } from './api.js';

/**
 * Applies deploy-time URLs from GET /api/public/config.
 * Expects `a[data-legal="privacy"]`, `a[data-legal="terms"]`, and optional `a[data-footer="support"]`.
 */
export async function applyLegalFooterLinks() {
  const privacy = document.querySelector('a[data-legal="privacy"]');
  const terms = document.querySelector('a[data-legal="terms"]');
  const support = document.querySelector('a[data-footer="support"]');
  if (!privacy && !terms && !support) return;
  try {
    const res = await fetch(`${API_BASE}/api/public/config`);
    if (!res.ok) return;
    /** @type {{
     *   privacyPolicyUrl?: string | null;
     *   termsOfServiceUrl?: string | null;
     *   supportUrl?: string | null;
     *   supportEmail?: string | null;
     * }} */
    const data = await res.json();
    if (privacy && data.privacyPolicyUrl) privacy.href = data.privacyPolicyUrl;
    if (terms && data.termsOfServiceUrl) terms.href = data.termsOfServiceUrl;
    if (support) {
      const href =
        data.supportUrl?.trim() ||
        (data.supportEmail?.trim()
          ? `mailto:${data.supportEmail.trim()}`
          : '');
      if (href) {
        support.href = href;
        support.hidden = false;
        if (!support.textContent?.trim()) {
          support.textContent = data.supportUrl?.trim() ? 'Support' : 'Email support';
        }
      }
    }
  } catch {
    // Keep defaults from HTML
  }
}
