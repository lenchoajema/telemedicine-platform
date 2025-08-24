import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage, LIMITED_I18N_MODE } from "../i18n";

let cachedLocales = null;

export default function LanguageSwitcher({ className = "" }) {
  const { i18n } = useTranslation();
  const [locales, setLocales] = useState(cachedLocales || []);
  const [loading, setLoading] = useState(!cachedLocales);

  useEffect(() => {
    if (cachedLocales) return;
    let cancelled = false;
    fetch("/api/i18n/locales")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = json?.data || [];
        cachedLocales = list;
        setLocales(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = async (e) => {
    const newLng = e.target.value;
    await changeAppLanguage(newLng);
  };

  const effectiveLocales = LIMITED_I18N_MODE
    ? locales.filter((l) => l.code === "en")
    : locales;
  return (
    <div className={`language-switcher ${className}`}>
      <select onChange={onChange} value={i18n.language} disabled={loading}>
        {effectiveLocales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
        {LIMITED_I18N_MODE &&
          locales
            .filter((l) => l.code !== "en")
            .map((l) => (
              <option key={l.code} value={l.code} disabled>
                {l.name} (Coming Soon)
              </option>
            ))}
      </select>
      {LIMITED_I18N_MODE && (
        <div
          className="i18n-coming-soon-note"
          style={{ fontSize: "0.75rem", marginTop: "4px", opacity: 0.75 }}
        >
          Additional languages coming soon.
        </div>
      )}
    </div>
  );
}
