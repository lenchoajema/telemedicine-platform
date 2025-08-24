import express from 'express';
import ContentTranslation from '../models/ContentTranslation.js';
import crypto from 'crypto';
import { setInterval } from 'timers';

// NOTE: This public i18n endpoint aims to be fast & cache friendly.
// Improvements added:
// 1. TTL-based cache eviction & lightweight cleanup.
// 2. Namespace & locale validation + sane limits to prevent abuse.
// 3. Additional response formats: json (default wrapper), i18next (single ns), flat.
// 4. Stronger ETag + Last-Modified + Cache-Control headers for downstream caching.
// 5. Optional flattening (flat=true) for clients needing flat key maps.
// 6. Consistent meta block returned for introspection.

const router = express.Router();
// Increment when resource shape logic changes to invalidate old in-memory cache/ETags
const RESOURCE_SCHEMA_VERSION = '3'; // bump when response shape logic changes

// Supported locales and rtl flags
const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'sw', name: 'Swahili', rtl: false },
  { code: 'fr', name: 'Français', rtl: false },
  { code: 'ar', name: 'العربية', rtl: true },
  // Accept both regioned and base code for Amharic so legacy 'am' works
  { code: 'am', name: 'Amharic', rtl: false },
  { code: 'am-ET', name: 'Amharic (Ethiopia)', rtl: false },
  { code: 'om-ET', name: 'Afaan Oromo (Ethiopia)', rtl: false },
  { code: 'so-SO', name: 'Somali', rtl: false },
  { code: 'ha-NG', name: 'Hausa (Nigeria)', rtl: false },
  { code: 'ti-ET', name: 'Tigrinya (Ethiopia)', rtl: false },
  { code: 'ti-ER', name: 'Tigrinya (Eritrea)', rtl: false },
  { code: 'yo-NG', name: 'Yoruba (Nigeria)', rtl: false },
  { code: 'zu-ZA', name: 'Zulu (South Africa)', rtl: false },
];

router.get('/locales', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data: SUPPORTED_LOCALES });
});

// GET /api/i18n/resources?locale=am-ET&ns[]=common&ns[]=clinical
// In-memory cache
// key: `${locale}|ns1,ns2|opts|vX` -> { ts, body, etag, lastModified }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (tunable)
const MAX_NAMESPACES = 12; // prevent abuse

function cleanupExpiredCache() {
  const now = Date.now();
  for (const [k, v] of cache.entries()) {
    if (now - v.ts > CACHE_TTL_MS) cache.delete(k);
  }
}

// Run occasional cleanup (very light)
setInterval(cleanupExpiredCache, CACHE_TTL_MS).unref();

function normalizeLocale(raw) {
  if (!raw) return 'en';
  const lower = String(raw).trim();
  // Exact match first
  if (SUPPORTED_LOCALES.some(l => l.code === lower)) return lower;
  const base = lower.split('-')[0];
  // Map legacy 'am' or variants without region to 'am-ET' if regioned present
  if (base === 'am') return 'am-ET';
  if (SUPPORTED_LOCALES.some(l => l.code === base)) return lower; // keep region form
  return 'en';
}

function flattenObject(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

router.get('/resources', async (req, res) => {
  try {
    // 1. Locale negotiation: explicit param -> Accept-Language -> default
    let rawLocale = req.query.locale ? String(req.query.locale) : '';
    if (!rawLocale) {
      const al = req.headers['accept-language'];
      if (typeof al === 'string' && al.length > 0) rawLocale = al.split(',')[0].trim();
    }
    const negotiatedLocale = normalizeLocale(rawLocale);
    let locale = negotiatedLocale;
    const baseLang = locale.includes('-') ? locale.split('-')[0] : locale;

    // 2. Namespaces (support ns or ns[]; default -> common)
    let ns = req.query.ns || req.query['ns[]'] || [];
    if (!Array.isArray(ns)) ns = [ns].filter(Boolean);
    if (ns.length === 0) ns = ['common'];
    if (ns.length > MAX_NAMESPACES) ns = ns.slice(0, MAX_NAMESPACES);

    // 3. Options and format
    const format = String(req.query.format || 'json'); // json|i18next|flat
    const flat = req.query.flat === 'true' || format === 'flat';

    // 4. Compose cache key including format & flat flag
    const cacheKey = `${locale}|${ns.sort().join(',')}|fmt:${format}|flat:${flat}|v${RESOURCE_SCHEMA_VERSION}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      // Conditional ETag
      if (req.headers['if-none-match'] === cached.etag) return res.status(304).end();
      // Optional If-Modified-Since support
      const ims = req.headers['if-modified-since'];
      if (ims && new Date(ims).getTime() >= cached.lastModified) {
        return res.status(304).end();
      }
      res.setHeader('ETag', cached.etag);
      res.setHeader('Last-Modified', new Date(cached.lastModified).toUTCString());
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=30');
      return res.json(cached.body);
    }

    // Fetch translations for requested namespaces and locale (with base language fallback merge)
    let rows = await ContentTranslation.find({ language: locale, namespace: { $in: ns } });
    if (rows.length === 0 && baseLang !== locale) {
      const baseRows = await ContentTranslation.find({ language: baseLang, namespace: { $in: ns } });
      if (baseRows.length > 0) rows = baseRows;
    } else if (baseLang !== locale) {
      const baseRows = await ContentTranslation.find({ language: baseLang, namespace: { $in: ns } });
      if (baseRows.length > 0) rows = [...baseRows, ...rows];
    }

    // Group into namespaces
    const bundles = {};
    for (const n of ns) bundles[n] = {};
    for (const r of rows) {
      if (!bundles[r.namespace]) bundles[r.namespace] = {};
      const target = bundles[r.namespace];
      const parts = r.key.split('.');
      // If first part equals namespace we will drop it to avoid duplication (admin.admin.appointments)
      if (parts.length > 1 && parts[0] === r.namespace) parts.shift();
      let cursor = target;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          cursor[part] = r.value;
        } else {
          if (!cursor[part]) cursor[part] = {};
          cursor = cursor[part];
        }
      }
    }

  // If DB empty (or namespace missing) and English, provide some defaults
  if (locale.startsWith('en')) {
      if (!bundles.common) bundles.common = {};
      // Core nav/actions (only set if not already returned from DB)
      if (!bundles.common['nav.home']) bundles.common['nav.home'] = 'Home';
      if (!bundles.common['nav.about']) bundles.common['nav.about'] = 'About';
      if (!bundles.common['nav.services']) bundles.common['nav.services'] = 'Services';
      if (!bundles.common['nav.contact']) bundles.common['nav.contact'] = 'Contact';
      if (!bundles.common['actions.signIn']) bundles.common['actions.signIn'] = 'Sign in';
      if (!bundles.common['actions.getStarted']) bundles.common['actions.getStarted'] = 'Get Started';
      // Generic status + actions
      if (!bundles.common['status.scheduled']) bundles.common['status.scheduled'] = 'Scheduled';
      if (!bundles.common['status.completed']) bundles.common['status.completed'] = 'Completed';
      if (!bundles.common['status.cancelled']) bundles.common['status.cancelled'] = 'Cancelled';
      if (!bundles.common['status.noShow']) bundles.common['status.noShow'] = 'No Show';
      if (!bundles.common['actions.complete']) bundles.common['actions.complete'] = 'Complete';
      if (!bundles.common['actions.cancel']) bundles.common['actions.cancel'] = 'Cancel';
      // Admin namespace fallbacks
      if (ns.includes('admin')) {
        if (!bundles.admin) bundles.admin = {};
        const a = bundles.admin;
        // Build nested structure instead of flat dotted keys
        const setDeep = (key, value) => {
          const parts = key.split('.');
          if (parts[0] === 'admin') parts.shift();
            let cur = a;
            for (let i=0;i<parts.length;i++) {
              const p = parts[i];
              if (i === parts.length - 1) {
                if (!cur[p]) cur[p] = value;
              } else {
                if (!cur[p]) cur[p] = {};
                cur = cur[p];
              }
            }
        };
        setDeep('admin.appointments.title', 'Appointment Management');
        setDeep('admin.appointments.subtitle', 'Monitor and manage all appointments');
        setDeep('admin.filters.searchPlaceholder', 'Search by patient or doctor name...');
        setDeep('admin.filters.allAppointments', 'All Appointments');
        setDeep('admin.filters.scheduled', 'Scheduled');
        setDeep('admin.filters.completed', 'Completed');
        setDeep('admin.filters.cancelled', 'Cancelled');
        setDeep('admin.filters.noShow', 'No Show');
        setDeep('admin.stats.scheduled', 'Scheduled');
        setDeep('admin.stats.completed', 'Completed');
        setDeep('admin.stats.cancelled', 'Cancelled');
        setDeep('admin.stats.total', 'Total');
        setDeep('admin.table.patient', 'Patient');
        setDeep('admin.table.doctor', 'Doctor');
        setDeep('admin.table.dateTime', 'Date & Time');
        setDeep('admin.table.type', 'Type');
        setDeep('admin.table.status', 'Status');
        setDeep('admin.table.reason', 'Reason');
        setDeep('admin.table.actions', 'Actions');
        setDeep('admin.table.noReason', 'No reason provided');
        setDeep('admin.table.details', 'Details');
        setDeep('admin.table.lifecycle', 'Lifecycle');
        setDeep('admin.empty.noAppointments', 'No appointments found matching your criteria.');
        setDeep('admin.insights.title', 'Appointment Insights');
        setDeep('admin.insights.mostPopularTime', 'Most Popular Time');
        setDeep('admin.insights.averageDuration', 'Average Duration');
        setDeep('admin.insights.completionRate', 'Completion Rate');
        setDeep('admin.insights.noShowRate', 'No-Show Rate');
      }
    } else if (locale.startsWith('am')) {
      // Provide minimal Amharic fallback so UI can display sample texts even before seeding DB.
      // Use nested object structure (NOT dotted literal keys) so i18next path lookups like t('nav.home') work.
      if (!bundles.common) bundles.common = {};
      const ensureNested = (root, path, value) => {
        const parts = path.split('.');
        let cur = root;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
            if (i === parts.length - 1) {
              if (cur[p] === undefined || typeof cur[p] === 'string') {
                if (cur[p] === undefined) cur[p] = value; // don't overwrite DB provided values
              }
            } else {
              if (cur[p] == null || typeof cur[p] === 'string') cur[p] = {}; // convert flat string to object if collision with dotted key form
              cur = cur[p];
            }
        }
      };
      const amCommon = bundles.common;
      ensureNested(amCommon, 'nav.home', 'መነሻ');
      ensureNested(amCommon, 'nav.about', 'ስለ እኛ');
      ensureNested(amCommon, 'nav.services', 'አገልግሎቶች');
      ensureNested(amCommon, 'nav.contact', 'አግኙን');
      ensureNested(amCommon, 'actions.signIn', 'ግባ');
      ensureNested(amCommon, 'actions.getStarted', 'ጀምር');
      if (ns.includes('admin')) {
        if (!bundles.admin) bundles.admin = {};
        const aRoot = bundles.admin;
        ensureNested(aRoot, 'appointments.title', 'የቀጠሮ አስተዳደር');
        ensureNested(aRoot, 'appointments.subtitle', 'ቀጠሮዎችን ይቆጣጠሩ እና ያስተዳድሩ');
  // Filters
  ensureNested(aRoot, 'filters.searchPlaceholder', 'በታካሚ ወይም በዶክተር ስም ፈልግ...');
  ensureNested(aRoot, 'filters.allAppointments', 'ሁሉም ቀጠሮዎች');
  ensureNested(aRoot, 'filters.scheduled', 'ታቅዷል');
  ensureNested(aRoot, 'filters.completed', 'ተጠናቋል');
  ensureNested(aRoot, 'filters.cancelled', 'ተሰርዟል');
  ensureNested(aRoot, 'filters.noShow', 'አልተገኘም');
  // Stats
  ensureNested(aRoot, 'stats.scheduled', 'ታቅዷል');
  ensureNested(aRoot, 'stats.completed', 'ተጠናቋል');
  ensureNested(aRoot, 'stats.cancelled', 'ተሰርዟል');
  ensureNested(aRoot, 'stats.total', 'ጠቅላላ');
  // Table
  ensureNested(aRoot, 'table.patient', 'ታካሚ');
  ensureNested(aRoot, 'table.doctor', 'ዶክተር');
  ensureNested(aRoot, 'table.dateTime', 'ቀን & ጊዜ');
  ensureNested(aRoot, 'table.type', 'አይነት');
  ensureNested(aRoot, 'table.status', 'ሁኔታ');
  ensureNested(aRoot, 'table.reason', 'ምክንያት');
  ensureNested(aRoot, 'table.actions', 'ተግባራት');
  ensureNested(aRoot, 'table.noReason', 'ምክንያት የለም');
  ensureNested(aRoot, 'table.details', 'ዝርዝር');
  ensureNested(aRoot, 'table.lifecycle', 'የሂደት ሁኔታ');
  // Empty state
  ensureNested(aRoot, 'empty.noAppointments', 'ከሚመስሉት መስፈርቶች ጋር የሚጣጣሙ ቀጠሮዎች አልተገኙም።');
  // Insights
  ensureNested(aRoot, 'insights.title', 'የቀጠሮ ግኝቶች');
  ensureNested(aRoot, 'insights.mostPopularTime', 'በጣም የሚወደድ ጊዜ');
  ensureNested(aRoot, 'insights.averageDuration', 'አማካይ ቆይታ');
  ensureNested(aRoot, 'insights.completionRate', 'የመጨረሻ ደረጃ መጠን');
  ensureNested(aRoot, 'insights.noShowRate', 'ያልተገኘ መጠን');
      }
    }

    let responseBody;
    if (format === 'i18next' && ns.length === 1) {
      responseBody = bundles[ns[0]] || {};
    } else if (flat) {
      // Flatten across requested namespaces with namespace prefix to avoid collisions
      const flatAll = {};
      for (const n of ns) {
        const b = bundles[n] || {};
        const flattened = flattenObject(b);
        for (const [k, v] of Object.entries(flattened)) {
          flatAll[`${n}.${k}`] = v;
        }
      }
      responseBody = flatAll;
    } else {
      responseBody = {
        success: true,
        locale: rawLocale || negotiatedLocale,
        servedLocale: locale,
        data: bundles,
        meta: {
          namespaces: ns,
          format,
          flat,
          schemaVersion: RESOURCE_SCHEMA_VERSION,
          generatedAt: new Date().toISOString(),
        },
      };
    }

    const payload = JSON.stringify(responseBody);
    const etag = 'W/"' + crypto.createHash('sha1').update(payload).digest('hex') + '"';
    const now = Date.now();
    cache.set(cacheKey, { ts: now, body: responseBody, etag, lastModified: now });
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', new Date(now).toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.json(responseBody);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load i18n resources', error: error.message });
  }
});

export default router;

// --- Cache Invalidation Helpers (used by admin routes) ---
/**
 * Invalidate cached bundles for given locales & namespaces.
 * If namespaces empty, all bundles for the locale are purged.
 */
export function invalidateI18nCache({ locales = [], namespaces = [] } = {}) {
  if ((!locales || locales.length === 0) && (!namespaces || namespaces.length === 0)) return;
  const localeSet = new Set(locales);
  const nsSet = new Set((namespaces || []).map(String));
  let removed = 0;
  for (const key of cache.keys()) {
    // key pattern: locale|ns1,ns2|fmt:... etc
    const [locPart, nsPart] = key.split('|');
    if (localeSet.size > 0 && !localeSet.has(locPart)) continue;
    if (nsSet.size > 0) {
      const keyNamespaces = nsPart.split(',');
      let intersects = false;
      for (const n of keyNamespaces) if (nsSet.has(n)) { intersects = true; break; }
      if (!intersects) continue;
    }
    cache.delete(key);
    removed++;
  }
  if (removed > 0) console.log(`i18n cache invalidated: removed ${removed} entries for locales=[${[...localeSet]}] namespaces=[${[...nsSet]}]`);
}
