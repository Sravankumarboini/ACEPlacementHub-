import React from 'react';
import { Link, useLocation } from 'wouter';
import { GraduationCap, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { Button } from '@/components/ui/button';

export function FacultyNavbar() {
  const [location] = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/faculty', label: 'Dashboard' },
    { path: '/faculty/students', label: 'Students' },
    { path: '/faculty/jobs', label: 'Jobs' },
    { path: '/faculty/applications', label: 'Applications' },
  ];

  const isActive = (path: string) => {
    if (path === '/faculty' && location === '/faculty') return true;
    return path !== '/faculty' && location.startsWith(path);
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
              <span className="ml-3 px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium">
                Faculty
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
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus size={16} className="mr-2" />
              New Job
            </Button>
            <NotificationDropdown />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-neutral-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="text-neutral-500 hover:text-neutral-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
