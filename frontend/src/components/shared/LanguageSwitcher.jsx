import React from "react";
import { useI18n } from "../../contexts/I18nContext";

export default function LanguageSwitcher({ className = "" }) {
  const { locale, locales, setLocale } = useI18n();
  const options = locales?.length
    ? locales
    : [{ code: "en", name: "English", rtl: false }];

  return (
    <select
      aria-label="Language"
      className={className}
      value={locale}
      onChange={(e) => {
        const next = e.target.value;
        if (next !== locale) setLocale(next);
      }}
    >
      {options.map((l) => (
        <option key={l.code} value={l.code}>
          {l.name} ({l.code})
        </option>
      ))}
    </select>
  );
}
