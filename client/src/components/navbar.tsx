import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Bell } from "lucide-react";
import NotificationDropdown from "./notification-dropdown";

interface NavbarProps {
  role: "student" | "faculty";
}

export default function Navbar({ role }: NavbarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const studentNavItems = [
    { path: "/", label: "Jobs" },
    { path: "/applications", label: "Applications" },
    { path: "/saved-jobs", label: "Saved Jobs" },
    { path: "/profile", label: "Profile" },
  ];

  const facultyNavItems = [
    { path: "/", label: "Dashboard" },
    { path: "/students", label: "Students" },
    { path: "/jobs", label: "Jobs" },
  ];

  const navItems = role === "student" ? studentNavItems : facultyNavItems;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary-foreground text-sm w-4 h-4" />
              </div>
              <span className="ml-3 text-xl font-bold text-foreground">ACEPlacementHub</span>
              {role === "faculty" && (
                <span className="ml-3 px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium">
                  Faculty
                </span>
              )}
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span className={`px-1 pt-1 pb-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    location === item.path
                      ? "text-primary border-primary"
                      : "text-muted-foreground hover:text-foreground border-transparent"
                  }`}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {role === "faculty" && (
              <Link href="/jobs">
                <Button size="sm" className="btn-primary">
                  <span className="hidden sm:inline mr-2">New Job</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </Link>
            )}
            
            <NotificationDropdown />
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                role === "student" ? "bg-primary" : "bg-secondary"
              }`}>
                <span className="text-white text-sm font-medium">
                  {user ? getInitials(user.firstName, user.lastName) : "??"}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
