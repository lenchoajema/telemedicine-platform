import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import i18n from "../i18n";
import apiClient from "../services/apiClient";

const I18nContext = createContext({
  locale: "en",
  locales: [],
  setLocale: () => {},
});

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem("locale") || "en";
    // Normalize legacy 'am' to 'am-ET'
    if (stored === "am") return "am-ET";
    return stored;
  });
  const [locales, setLocales] = useState([]);

  // Load supported locales
  useEffect(() => {
    apiClient
      .get("/i18n/locales")
      .then((res) => setLocales(res.data?.data || []))
      .catch(() => setLocales([{ code: "en", name: "English", rtl: false }]));
  }, []);

  // Load resources for the current locale lazily
  useEffect(() => {
    async function loadResources() {
      try {
        const ns = [
          "common",
          "dashboard",
          "clinical",
          "billing",
          "notifications",
          "admin", // preload admin namespace so switching shows immediate effect
        ];
        const qs = ns.map((n) => `ns[]=${encodeURIComponent(n)}`).join("&");
        const res = await apiClient.get(
          `/i18n/resources?locale=${encodeURIComponent(locale)}&${qs}`
        );
        const bundles = res.data?.data || {};
        // Add to i18n instance
        Object.entries(bundles).forEach(([namespace, resources]) => {
          if (i18n.hasResourceBundle(locale, namespace)) {
            i18n.removeResourceBundle(locale, namespace);
          }
          i18n.addResourceBundle(locale, namespace, resources, true, true);
        });
        // Ensure resources are fully available before switching language
        const namespaces = Object.keys(bundles);
        if (namespaces.length > 0) {
          await i18n.reloadResources([locale], namespaces);
        }
        await i18n.changeLanguage(locale);

        // RTL and font handling
        const info = locales.find((l) => l.code === locale) || {};
        const isRtl = !!info.rtl || locale.startsWith("ar");
        document.documentElement.setAttribute("lang", locale);
        document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
        document.body.classList.toggle("rtl", isRtl);
        const isEthiopic = locale.startsWith("am") || locale.startsWith("ti-");
        document.body.classList.toggle("ethiopic", isEthiopic);
        // If Ethiopic selected and local fonts missing, inject Google Fonts fallback once
        if (isEthiopic && !document.getElementById("ethiopic-font-fallback")) {
          const testUrl = "/fonts/NotoSansEthiopic-Regular.woff2";
          fetch(testUrl, { method: "HEAD" })
            .then((r) => {
              if (!r.ok) {
                const link = document.createElement("link");
                link.id = "ethiopic-font-fallback";
                link.rel = "stylesheet";
                link.href =
                  "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap";
                document.head.appendChild(link);
              }
            })
            .catch(() => {
              const link = document.createElement("link");
              link.id = "ethiopic-font-fallback";
              link.rel = "stylesheet";
              link.href =
                "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap";
              document.head.appendChild(link);
            });
        }
        if (process.env.NODE_ENV !== "production") {
          // Light debug so we can confirm dynamic resource availability
          console.debug(
            "[i18n] Active locale switched to",
            locale,
            "namespaces:",
            Object.keys(bundles)
          );
        }
      } catch (e) {
        // fallback to en
        await i18n.changeLanguage("en");
      }
    }
    localStorage.setItem("locale", locale);
    loadResources();
  }, [locale, locales]);

  const value = useMemo(
    () => ({ locale, locales, setLocale }),
    [locale, locales]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
