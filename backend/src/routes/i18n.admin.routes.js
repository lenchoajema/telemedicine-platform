import express from 'express';
import ContentTranslation from '../models/ContentTranslation.js';
import { authorizePrivilege } from '../middleware/rbac.middleware.js';
import AuditService from '../services/AuditService.js';
import { invalidateI18nCache } from './i18n.public.routes.js';

const router = express.Router();

// Admin-only: upsert translations
router.put('/translations', authorizePrivilege('AdminSettings.Write'), async (req, res) => {
  try {
    const payload = req.body;
    const items = Array.isArray(payload) ? payload : [payload];
    const results = [];
    const touchedLocales = new Set();
    const touchedNamespaces = new Set();
    for (const raw of items) {
      const item = raw || {};
      let { namespace, key, language, value } = item;
      if (!namespace || !key || !language) continue;
      namespace = String(namespace).trim();
      key = String(key).trim();
      language = String(language).trim();
      if (namespace.length > 64 || key.length > 256) continue; // safety limits
      const updated = await ContentTranslation.findOneAndUpdate(
        { namespace, key, language },
        { value, updatedById: req.user._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(updated);
      touchedLocales.add(language);
      touchedNamespaces.add(namespace);
      await AuditService.log(req.user._id, req.user.role, 'i18n_translation_upsert', 'content_translation', updated._id, { namespace, key, language });
    }
    if (results.length > 0) {
      invalidateI18nCache({ locales: [...touchedLocales], namespaces: [...touchedNamespaces] });
    }
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upsert translations', error: error.message });
  }
});

// Delete translations (bulk) by id or by composite key
router.delete('/translations', authorizePrivilege('AdminSettings.Write'), async (req, res) => {
  try {
    const payload = req.body;
    const items = Array.isArray(payload) ? payload : [payload];
    const touchedLocales = new Set();
    const touchedNamespaces = new Set();
    let deleted = 0;
    for (const raw of items) {
      const { _id, namespace, key, language } = raw || {};
      let result;
      if (_id) {
        result = await ContentTranslation.findByIdAndDelete(_id);
      } else if (namespace && key && language) {
        result = await ContentTranslation.findOneAndDelete({ namespace, key, language });
      }
      if (result) {
        deleted++;
        touchedLocales.add(result.language);
        touchedNamespaces.add(result.namespace);
        await AuditService.log(req.user._id, req.user.role, 'i18n_translation_delete', 'content_translation', result._id, { namespace: result.namespace, key: result.key, language: result.language });
      }
    }
    if (deleted > 0) invalidateI18nCache({ locales: [...touchedLocales], namespaces: [...touchedNamespaces] });
    res.json({ success: true, deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete translations', error: error.message });
  }
});

// Admin-only: search/manage translations
router.get('/translations', authorizePrivilege('AdminSettings.Read'), async (req, res) => {
  try {
    const { locale, ns, q, limit = 100, skip = 0 } = req.query;
    const filter = {};
    if (locale) filter.language = locale;
    if (ns) filter.namespace = ns;
    if (q) filter.key = new RegExp(q, 'i');
    const rows = await ContentTranslation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 500))
      .skip(parseInt(skip, 10) || 0);
    const total = await ContentTranslation.countDocuments(filter);
    res.json({ success: true, total, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to query translations', error: error.message });
  }
});

// Explicit cache invalidation endpoint (optional use in admin UI)
router.post('/invalidate-cache', authorizePrivilege('AdminSettings.Write'), (req, res) => {
  try {
    const { locales = [], namespaces = [] } = req.body || {};
    invalidateI18nCache({ locales, namespaces });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to invalidate cache', error: e.message });
  }
});

export default router;
