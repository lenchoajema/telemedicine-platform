import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import RemindersDropdown from "./RemindersDropdown";
import ThemeToggle from "../shared/ThemeToggle";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import "./Header.css";
import { useI18n } from "../../contexts/I18nContext.jsx";

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { locale, locales, setLocale } = useI18n();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    { name: t("nav.home", "Home"), href: "/" },
    { name: t("nav.about", "About"), href: "/about" },
    { name: t("nav.services", "Services"), href: "/services" },
    { name: t("nav.contact", "Contact"), href: "/contact" },
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Left side - Logo and mobile menu button */}
          <div className="header-left">
            {/* Mobile menu button - only show when user is logged in */}
            {user && (
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="menu-icon" aria-hidden="true" />
              </button>
            )}

            {/* Logo */}
            <div className="logo-container">
              <Link to="/" className="logo-link">
                <div className="logo-icon">
                  <span className="logo-text">TM</span>
                </div>
                <span className="logo-title">TeleMedicine</span>
              </Link>
            </div>
          </div>

          {/* Center - Navigation (desktop only, not authenticated) */}
          {!user && (
            <nav className="header-nav">
              {navigation.map((item) => (
                <Link key={item.name} to={item.href} className="nav-link">
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side - Auth buttons or user menu */}
          <div className="header-right">
            {/* Language selector */}
            <LanguageSwitcher className="lang-switcher" />
            {user ? (
              <>
                {/* Reminders Dropdown */}
                <RemindersDropdown />

                {/* Theme toggle (compact icon) */}
                <ThemeToggle variant="icon" />
                {/* Language switcher (duplicate removed; we now render once above) */}

                {/* User menu */}
                <div className="user-menu">
                  <button
                    type="button"
                    className="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="user-avatar">
                      {user.profile?.photo ? (
                        <img
                          className="user-avatar-img"
                          src={user.profile.photo}
                          alt=""
                        />
                      ) : (
                        <UserIcon
                          className="user-avatar-icon"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="user-menu-dropdown">
                      <div className="user-info">
                        <p className="user-name">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="user-email">{user.email}</p>
                      </div>
                      <div className="menu-divider"></div>
                      <Link to="/profile" className="menu-item">
                        <UserIcon className="menu-icon" />
                        {t("nav.profile", "Profile")}
                      </Link>
                      <Link to="/settings" className="menu-item">
                        <Cog6ToothIcon className="menu-icon" />
                        {t("nav.settings", "Settings")}
                      </Link>
                      <div className="menu-divider"></div>
                      <button
                        onClick={handleLogout}
                        className="menu-item menu-item-logout"
                      >
                        <ArrowRightOnRectangleIcon className="menu-icon" />
                        {t("actions.signOut", "Sign out")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  {t("actions.signIn", "Sign in")}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t("actions.getStarted", "Get Started")}
                </Link>
                <LanguageSwitcher className="lang-switcher" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {!user && mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="logo-container">
                <div className="logo-icon">
                  <span className="logo-text">TM</span>
                </div>
                <span className="logo-title">TeleMedicine</span>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="close-icon" aria-hidden="true" />
              </button>
            </div>
            <div className="mobile-nav">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mobile-auth">
                <Link to="/login" className="btn btn-secondary btn-full">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-full">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
