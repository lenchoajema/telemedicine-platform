import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import "./Sidebar.css";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  // Different navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
      { name: "Community", href: "/forums/categories", icon: DocumentTextIcon },
    ];

    if (user?.role === "doctor") {
      return [
        ...baseNavigation,
        {
          name: "Appointments",
          href: "/doctor/appointments",
          icon: CalendarIcon,
        },
        { name: "Calendar", href: "/doctor/calendar", icon: CalendarIcon },
        { name: "Patients", href: "/doctor/patients", icon: UserGroupIcon },
        {
          name: "Medical Records",
          href: "/doctor/medical-records",
          icon: DocumentTextIcon,
        },
        { name: "Video Calls", href: "/video-calls", icon: VideoCameraIcon },
        { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
        { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
      ];
    } else if (user?.role === "patient") {
      return [
        ...baseNavigation,
        { name: "Appointments", href: "/appointments", icon: CalendarIcon },
        { name: "My Doctors", href: "/doctors", icon: UserGroupIcon },
        { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
        {
          name: "Medical History",
          href: "/medical-records",
          icon: DocumentTextIcon,
        },
        {
          name: "Symptom Checker",
          href: "/symptom-check",
          icon: QuestionMarkCircleIcon,
        },
        {
          name: "PHR",
          href: "/phr",
          icon: DocumentTextIcon,
        },
        {
          name: "Video Calls",
          href: "/patient/video-calls",
          icon: VideoCameraIcon,
        },
        {
          name: "Settings",
          href: "/patient/settings",
          icon: Cog6ToothIcon,
        },
      ];
    } else if (user?.role === "admin") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
        { name: "User Management", href: "/admin/users", icon: UserGroupIcon },
        { name: "Roles", href: "/admin/roles", icon: ShieldCheckIcon },
        { name: "Doctors", href: "/admin/doctors", icon: UserIcon },
        {
          name: "Appointments",
          href: "/admin/appointments",
          icon: CalendarIcon,
        },
        { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
        { name: "Metrics", href: "/admin/metrics", icon: ChartBarIcon },
        { name: "Pricing", href: "/admin/pricing", icon: DocumentTextIcon },
        { name: "Banks", href: "/admin/banks", icon: DocumentTextIcon },
        {
          name: "Bank Change Log",
          href: "/admin/banks?tab=logs",
          icon: DocumentTextIcon,
        },
        { name: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
        {
          name: "Audit Logs",
          href: "/admin/audit-logs",
          icon: DocumentTextIcon,
        },
      ];
    } else if (user?.role === "pharmacist") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
        { name: "Portals", href: "/portals", icon: DocumentTextIcon },
        { name: "Pharmacy Profile", href: "/pharmacy/portal", icon: UserIcon },
        {
          name: "Inventory",
          href: "/pharmacy/inventory",
          icon: DocumentTextIcon,
        },
        { name: "Orders", href: "/pharmacy/orders", icon: CalendarIcon },
        { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
      ];
    } else if (user?.role === "laboratory") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
        { name: "Portals", href: "/portals", icon: DocumentTextIcon },
        { name: "Lab Profile", href: "/laboratory/portal", icon: UserIcon },
        {
          name: "Catalog",
          href: "/laboratory/catalog",
          icon: DocumentTextIcon,
        },
        { name: "Orders", href: "/laboratory/orders", icon: CalendarIcon },
        { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
      ];
    }

    return baseNavigation;
  };

  const navigation = getNavigation();
  // Add support chat link
  navigation.push({
    name: "Support",
    href: "/chat?support=true",
    icon: ChatBubbleLeftRightIcon,
  });

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
                      className={`nav-link ${isActive ? "active" : ""}`}
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
                    {user?.profile?.firstName?.[0] ||
                      user?.email?.[0]?.toUpperCase() ||
                      "U"}
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
