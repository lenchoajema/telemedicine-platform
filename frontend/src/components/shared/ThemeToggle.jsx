import { useEffect, useState } from "react";

const storageKey = "tm-theme";

export default function ThemeToggle({ className = "", variant = "select" }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
  }, [theme]);

  const nextTheme = () => {
    if (theme === "system") return "light";
    if (theme === "light") return "dark";
    return "system";
  };

  const Icon = () => {
    if (theme === "dark") {
      // Moon
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      );
    }
    if (theme === "light") {
      // Sun
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
        </svg>
      );
    }
    // System (monitor)
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    );
  };

  if (variant === "icon") {
    const label = `Switch theme (current: ${theme})`;
    return (
      <button
        type="button"
        className={`btn btn-ghost btn-sm ${className}`}
        onClick={() => setTheme(nextTheme())}
        aria-label={label}
        title={label}
      >
        <Icon />
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="label">Theme</label>
      <select
        className="select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        aria-label="Select theme"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
