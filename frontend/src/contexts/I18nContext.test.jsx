import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nProvider, useI18n } from "./I18nContext.jsx";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";

// Mock apiClient to control locales and resources responses
jest.mock("../services/apiClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (url.startsWith("/i18n/locales")) {
        return Promise.resolve({
          data: {
            data: [
              { code: "en", name: "English", rtl: false },
              { code: "am-ET", name: "Amharic (Ethiopia)", rtl: false },
              { code: "ar", name: "Arabic", rtl: true },
            ],
          },
        });
      }
      if (url.startsWith("/i18n/resources")) {
        const params = new URL("http://x" + url).searchParams;
        const locale = params.get("locale");
        return Promise.resolve({
          data: {
            data: {
              common: {
                nav: {
                  home: locale === "ar" ? "الرئيسية" : "Home",
                },
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    }),
  },
}));

function Dummy() {
  const { locale, locales, setLocale } = useI18n();
  const { t } = useTranslation("common");
  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="t-home">{t("nav.home")}</div>
      <select
        aria-label="Language"
        data-testid="select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
      >
        {(locales || []).map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("dir");
    document.body.classList.remove("rtl", "ethiopic");
  });

  it("loads locales and switches language", async () => {
    render(
      <I18nProvider>
        <Dummy />
      </I18nProvider>
    );

    // Wait for locales to load
    await waitFor(() =>
      expect(
        screen.getByTestId("select").querySelectorAll("option").length
      ).toBeGreaterThan(0)
    );

    // Default should be en
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("t-home").textContent).toBe("Home");

    // Switch to Arabic and verify rtl flags
    fireEvent.change(screen.getByTestId("select"), { target: { value: "ar" } });

    await waitFor(() =>
      expect(document.documentElement.getAttribute("dir")).toBe("rtl")
    );
    await waitFor(() =>
      expect(screen.getByTestId("locale").textContent).toBe("ar")
    );
    await waitFor(() =>
      expect(screen.getByTestId("t-home").textContent).toBe("الرئيسية")
    );
    expect(document.body.classList.contains("rtl")).toBe(true);

    // Switch to Amharic and verify ethiopic class
    fireEvent.change(screen.getByTestId("select"), {
      target: { value: "am-ET" },
    });

    await waitFor(() =>
      expect(document.documentElement.getAttribute("dir")).toBe("ltr")
    );
    expect(document.body.classList.contains("ethiopic")).toBe(true);
  });
});
