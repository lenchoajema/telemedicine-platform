# I18N Limited Mode (MVP)

Set `VITE_I18N_LIMIT=true` in your frontend `.env` to enable limited i18n mode.

Behavior when enabled:

- Only English (`en`) is selectable.
- Other locales appear disabled with a "Coming Soon" label in the language switcher.
- Any attempt to switch programmatically to a different locale keeps the app in English.
- Lets you ship an MVP without removing i18n infrastructure.

Disable (remove or set to `false`) to re-enable full dynamic language loading from `/api/i18n/resources`.

Affected code:

- `src/i18n.js` exports `LIMITED_I18N_MODE` and guards `changeAppLanguage`.
- `src/components/LanguageSwitcher.jsx` filters and annotates options.

Full launch checklist:

1. Remove or set `VITE_I18N_LIMIT=false`.
2. Seed translations: run backend seeding scripts (`seed-i18n`, `seed-amharic-translations`).
3. (Optional) Run gap report and backfill.
4. Verify switcher now enables languages and content loads.

Fallbacks are implemented for English and minimal Amharic to avoid blank UI during seeding.
