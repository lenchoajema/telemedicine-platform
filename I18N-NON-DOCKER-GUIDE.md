# I18N & Amharic Setup Without Docker

This project can run fully without docker-compose. These steps cover seeding and verifying multi-language (focus: Amharic) directly on your host.

## 1. Environment

Create a `backend/.env` from the example:

```
cp backend/.env.example backend/.env
```

Edit `MONGO_URI` with your MongoDB connection string.

## 2. Install Dependencies

```
npm run install:all
```

## 3. Seed Core Data (Optional)

```
cd backend
npm run seed:root-admin
```

## 4. Seed Amharic Translations

```
npm run i18n:seed:amharic      # (from repo root) OR
cd backend && npm run seed:amharic
```

## 5. Verify Amharic Retrieval

Start backend first:

```
cd backend
npm run dev
```

In a second terminal:

```
npm run i18n:test:amharic      # (root) OR cd backend && npm run test:i18n:amharic
```

You should see `nav.home => መነሻ`.

## 6. Refresh After Updates

If you edit translation seeds or add new keys:

```
npm run i18n:refresh:amharic
```

## 7. Adding New Translations Manually

Use the admin API (requires auth & privilege):

```
PUT /api/admin/i18n/translations
[
  { "namespace": "common", "key": "nav.help", "language": "am", "value": "እርዳታ" }
]
```

Cache invalidates automatically; otherwise call:

```
POST /api/admin/i18n/invalidate-cache
{ "locales": ["am","am-ET"], "namespaces": ["common"] }
```

## 8. Frontend Integration (i18next)

Configure i18next to request:
`/api/i18n/resources?locale=<lng>&ns[]=common&ns[]=admin`
Enable caching via ETag & `If-None-Match` headers (browser handles automatically).

## 9. Troubleshooting

| Issue                        | Fix                                                                        |
| ---------------------------- | -------------------------------------------------------------------------- |
| ECONNREFUSED localhost:27017 | Ensure MONGO_URI points to a reachable Mongo instance (Atlas or local).    |
| Amharic keys missing         | Re-run seed or verify the namespace list `ns[]` includes the expected one. |
| Cache not updating           | Use invalidate-cache endpoint or restart backend.                          |

## 10. Next Improvements (Optional)

- Add Redis-based distributed cache for i18n.
- Add completeness report endpoint.
- Add CI step to fail if translation coverage drops.

---

Maintainer tip: keep seeds idempotent so re-running never duplicates data.
