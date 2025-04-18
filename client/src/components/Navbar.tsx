import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-primary font-bold text-2xl cursor-pointer">
                  HomeBond<span className="text-secondary-700">SA</span>
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <span
                  className={`${
                    isActive("/")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  Home
                </span>
              </Link>
              <Link href="/about">
                <span
                  className={`${
                    isActive("/about")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  About Us
                </span>
              </Link>
              <Link href="/services">
                <span
                  className={`${
                    isActive("/services")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  Services
                </span>
              </Link>
              <Link href="/calculators">
                <span
                  className={`${
                    isActive("/calculators")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  Calculators
                </span>
              </Link>
              <Link href="/determinator">
                <span
                  className={`${
                    isActive("/determinator")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  Find My Loan
                </span>
              </Link>
              <Link href="/loan-eligibility">
                <span
                  className={`${
                    isActive("/loan-eligibility")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  Loan Eligibility
                </span>
              </Link>
              <Link href="/faq">
                <span
                  className={`${
                    isActive("/faq")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  FAQ
                </span>
              </Link>
              <Link href="/contact">
                <span
                  className={`${
                    isActive("/contact")
                      ? "border-primary-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                >
                  Contact
                </span>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      {user.firstName || user.username}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href="/profile">
                      <DropdownMenuItem>
                        My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/documents">
                      <DropdownMenuItem>
                        My Documents
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/agent/dashboard">
                      <DropdownMenuItem>
                        Agent Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="ml-3 relative flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="link" className="text-primary">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <span
                className={`${
                  isActive("/")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                Home
              </span>
            </Link>
            <Link href="/about">
              <span
                className={`${
                  isActive("/about")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                About Us
              </span>
            </Link>
            <Link href="/services">
              <span
                className={`${
                  isActive("/services")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                Services
              </span>
            </Link>
            <Link href="/calculators">
              <span
                className={`${
                  isActive("/calculators")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                Calculators
              </span>
            </Link>
            <Link href="/determinator">
              <span
                className={`${
                  isActive("/determinator")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                Find My Loan
              </span>
            </Link>
            <Link href="/loan-eligibility">
              <span
                className={`${
                  isActive("/loan-eligibility")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                Loan Eligibility
              </span>
            </Link>
            <Link href="/faq">
              <span
                className={`${
                  isActive("/faq")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                FAQ
              </span>
            </Link>
            <Link href="/contact">
              <span
                className={`${
                  isActive("/contact")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
              >
                Contact
              </span>
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="px-4 space-y-2">
                <div className="text-base font-medium text-gray-800">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user.email}
                </div>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    My Profile
                  </Button>
                </Link>
                <Link href="/agent/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    Agent Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="px-4 space-y-2">
                <Link href="/login">
                  <Button
                    variant="link"
                    className="text-primary w-full justify-start"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
