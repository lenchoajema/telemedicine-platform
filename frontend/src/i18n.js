import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Backend API base (adjust if API proxied differently in prod)
export const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://telemedicine-platform-mt8a.onrender.com/api';

// Limited i18n mode (MVP): if true we restrict functional translations to English only and mark others as coming soon
export const LIMITED_I18N_MODE = (import.meta.env.VITE_I18N_LIMIT || '').toLowerCase() === 'true';

// Namespaces used globally (extend as needed)
const CORE_NAMESPACES = ['common', 'admin'];

// Resolve initial language: saved preference -> browser -> fallback
let saved = null;
try { saved = localStorage.getItem('locale'); } catch {}
const initialLng = saved || 'en';

// Seed minimal inline EN so UI renders before async load
const seedResources = {
  en: {
    common: {
      nav: { home: 'Home', about: 'About', services: 'Services', contact: 'Contact' },
      actions: { signIn: 'Sign in', getStarted: 'Get Started' }
    }
  }
};

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: 'en',
  debug: false,
  interpolation: { escapeValue: false },
  resources: seedResources,
  defaultNS: 'common',
  ns: CORE_NAMESPACES,
  react: { useSuspense: false }
});

async function fetchNamespaces(locale, namespaces = CORE_NAMESPACES) {
  const params = namespaces.map(n => `ns[]=${encodeURIComponent(n)}`).join('&');
  const url = `${API_BASE}/i18n/resources?locale=${encodeURIComponent(locale)}&${params}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`i18n fetch failed ${res.status}`);
  const data = await res.json();
  // Accept both wrapper { data: { ns: { ... }}} or bare namespace object
  const bundles = data.data || data;
  return bundles;
}

async function loadLanguage(locale) {
  // If bundle exists but is missing a known key (e.g., nav.home), allow re-fetch to repair dotted/nested mismatch
  const hasCommon = i18n.hasResourceBundle(locale, 'common');
  if (hasCommon) {
    const probe = i18n.getResource(locale, 'common', 'nav.home');
    if (probe) return; // Already healthy
    // else fall through to refetch/merge
  }
  const bundles = await fetchNamespaces(locale);
  Object.entries(bundles).forEach(([ns, resource]) => {
    if (resource && typeof resource === 'object') {
      i18n.addResourceBundle(locale, ns, resource, true, true);
    }
  });
}

export async function changeAppLanguage(locale) {
  try {
    if (LIMITED_I18N_MODE && locale !== 'en') {
      console.log('[i18n] Limited mode active – non-English languages are coming soon.');
      // Ensure UI stays on English
      await i18n.changeLanguage('en');
      try { localStorage.setItem('locale', 'en'); } catch {}
      return;
    }
    await loadLanguage(locale);
    await i18n.changeLanguage(locale);
    try { localStorage.setItem('locale', locale); } catch {}
    // Optional: add dir attribute if RTL (Amharic is LTR so skip)
    const rtl = ['ar', 'he', 'fa', 'ur'];
  document.documentElement.dir = rtl.some(p => locale.startsWith(p)) ? 'rtl' : 'ltr';
  // Ethiopic font activation: apply body class when Amharic selected
  const body = document.body;
  if (locale.startsWith('am')) body.classList.add('ethiopic'); else body.classList.remove('ethiopic');
  } catch (e) {
    console.log('Language switch failed:', e.message);
  }
}

// Preload initial language (other than default en)
if (initialLng !== 'en') {
  loadLanguage(initialLng).catch(e => console.log('Initial language load failed', e.message));
}

export default i18n;
