import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import './Header.css';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
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
                <Link
                  key={item.name}
                  to={item.href}
                  className="nav-link"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side - Auth buttons or user menu */}
          <div className="header-right">
            {user ? (
              <>
                {/* Notifications */}
                <button type="button" className="notification-btn">
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="notification-icon" aria-hidden="true" />
                </button>

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
                        <UserIcon className="user-avatar-icon" aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="user-menu-dropdown">
                      <div className="user-info">
                        <p className="user-name">{user.profile?.firstName} {user.profile?.lastName}</p>
                        <p className="user-email">{user.email}</p>
                      </div>
                      <div className="menu-divider"></div>
                      <Link to="/profile" className="menu-item">
                        <UserIcon className="menu-icon" />
                        Profile
                      </Link>
                      <Link to="/settings" className="menu-item">
                        <Cog6ToothIcon className="menu-icon" />
                        Settings
                      </Link>
                      <div className="menu-divider"></div>
                      <button onClick={handleLogout} className="menu-item menu-item-logout">
                        <ArrowRightOnRectangleIcon className="menu-icon" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
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
          </div>

          {/* Center - Desktop navigation for non-logged-in users */}
          <div className="flex-1 flex justify-center">
            {!user && (
              <nav className="hidden md:flex space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-500 transition-all duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right side - User menu or auth buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-900">
                          {user.profile?.fullName || user.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.role}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Auth buttons for non-logged-in users */
              <>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu button for navigation (only when not logged in) */}
            {!user && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu - only show when user is not logged in */}
      {!user && mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {/* Mobile auth buttons */}
          <div className="border-t border-gray-200 pt-4 pb-3 px-4">
            <div className="flex space-x-3">
              <Link
                to="/login"
                className="flex-1 text-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}