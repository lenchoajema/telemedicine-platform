import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  VideoCameraIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import './Sidebar.css';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  // Different navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
    ];

    if (user?.role === 'doctor') {
      return [
        ...baseNavigation,
        { name: 'Patients', href: '/patients', icon: UserGroupIcon },
        { name: 'Medical Records', href: '/medical-records', icon: DocumentTextIcon },
        { name: 'Video Calls', href: '/video-calls', icon: VideoCameraIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
      ];
    } else if (user?.role === 'patient') {
      return [
        ...baseNavigation,
        { name: 'My Doctors', href: '/doctors', icon: UserGroupIcon },
        { name: 'Medical History', href: '/medical-records', icon: DocumentTextIcon },
        { name: 'Video Calls', href: '/video-calls', icon: VideoCameraIcon },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
      ];
    } else if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
        { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
        { name: 'Doctors', href: '/admin/doctors', icon: UserGroupIcon },
        { name: 'Appointments', href: '/admin/appointments', icon: CalendarIcon },
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
        { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
      ];
    }

    return baseNavigation;
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {/* Mobile close button */}
          <div className="sidebar-close-container">
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="close-icon" aria-hidden="true" />
            </button>
          </div>

          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-icon">
                <span className="logo-text">TM</span>
              </div>
              <span className="logo-title">TeleMedicine</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name} className="nav-item">
                    <Link
                      to={item.href}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="nav-icon" aria-hidden="true" />
                      <span className="nav-text">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="sidebar-user">
            <div className="user-info">
              <div className="user-avatar">
                {user?.profile?.photo ? (
                  <img
                    className="user-avatar-img"
                    src={user.profile.photo}
                    alt=""
                  />
                ) : (
                  <span className="user-avatar-text">
                    {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="user-details">
                <p className="user-name">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
