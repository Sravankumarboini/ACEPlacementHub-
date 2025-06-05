import React from 'react';
import { Link, useLocation } from 'wouter';
import { GraduationCap, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function StudentNavbar() {
  const [location] = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/', label: 'Jobs' },
    { path: '/applications', label: 'Applications' },
    { path: '/saved-jobs', label: 'Saved Jobs' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    return path !== '/' && location.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white text-sm" size={16} />
              </div>
              <span className="ml-3 text-xl font-bold text-neutral-900">
                ACEPlacementHub
              </span>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`px-1 pt-1 pb-4 text-sm font-medium border-b-2 ${
                      isActive(item.path)
                        ? 'text-primary border-primary'
                        : 'text-neutral-500 hover:text-neutral-700 border-transparent'
                    }`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-neutral-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
