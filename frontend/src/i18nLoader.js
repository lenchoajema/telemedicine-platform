import i18n from './i18n';

// Runtime loader fetching backend namespaces on demand.
// Avoid 'typeof import' (reserved) which caused syntax error in some bundlers.
const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

export async function loadNamespaces(namespaces = [], locale = i18n.language || 'en') {
  if (!Array.isArray(namespaces)) namespaces = [namespaces];
  const needed = namespaces.filter(ns => !i18n.hasResourceBundle(locale, ns));
  if (needed.length === 0) return;
  const params = new URLSearchParams();
  params.set('locale', locale);
  needed.forEach(n => params.append('ns[]', n));
  try {
    const res = await fetch(`${API_BASE}/i18n/resources?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch i18n resources');
    const data = await res.json();
    const bundles = data?.data || data; // Support aggregated or single namespace
    for (const ns of Object.keys(bundles || {})) {
      const existing = i18n.getResourceBundle(locale, ns) || {};
      i18n.addResourceBundle(locale, ns, { ...existing, ...bundles[ns] }, true, true);
    }
  } catch (e) {
    console.log('i18n load error', e.message);
  }
}

export function changeLanguage(locale) {
  return i18n.changeLanguage(locale);
}

export default { loadNamespaces, changeLanguage };
