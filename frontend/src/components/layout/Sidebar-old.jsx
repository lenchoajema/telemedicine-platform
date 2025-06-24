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

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs">
            <div className="relative flex w-full flex-col bg-white">
              <div className="absolute top-0 right-0 p-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                </button>
              </div>
              
              <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TM</span>
                  </div>
                  <span className="ml-2 text-lg font-bold text-gray-900">
                    TeleMedicine
                  </span>
                </div>
                
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={classNames(
                                location.pathname === item.href
                                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                  : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50',
                                'group flex gap-x-3 rounded-l-md p-2.5 text-sm leading-6 font-medium transition-colors duration-200'
                              )}
                            >
                              <item.icon
                                className={classNames(
                                  location.pathname === item.href 
                                    ? 'text-blue-700' 
                                    : 'text-gray-400 group-hover:text-blue-700',
                                  'h-5 w-5 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>

                {/* User info at bottom */}
                <div className="border-t border-gray-200 pt-4 pb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.profile?.fullName || user?.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TM</span>
            </div>
            <span className="ml-2 text-lg font-bold text-gray-900">
              TeleMedicine
            </span>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50',
                          'group flex gap-x-3 rounded-l-md p-2.5 text-sm leading-6 font-medium transition-colors duration-200'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.href 
                              ? 'text-blue-700' 
                              : 'text-gray-400 group-hover:text-blue-700',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* User info at bottom */}
          <div className="border-t border-gray-200 pt-4 pb-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.fullName || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
