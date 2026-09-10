import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mountain,
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  UserCircle,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/forts", label: "Explore Forts" },
    { href: "/trek-groups", label: "Find Groups" },
    { href: "/trek-planner", label: "Trek Planner", requireAuth: true },
    { href: "/ride-booking", label: "Book Rides", requireAuth: true },
    { href: "/about", label: "About" },
  ];

  const contentItems = [
    { href: "/contribute", label: "Add Content", requireAuth: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Name */}
          <Link to="/" className="flex items-center">
            <span className="font-extrabold text-xl sm:text-2xl tracking-widest uppercase bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              NOMAD TREKKERS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              // Hide protected routes for non-authenticated users
              if (item.requireAuth && !isAuthenticated) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Content Management Items - only show for authenticated users */}
            {isAuthenticated && (
              <div className="border-l pl-4 space-x-4">
                {contentItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === item.href
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Admin Panel - only show for admin users */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === "/admin"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Authentication Section */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {user?.full_name ? (
                          getInitials(user.full_name)
                        ) : (
                          <UserCircle className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      {isAdmin && (
                        <p className="text-xs leading-none text-orange-600 font-medium">
                          Administrator
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="h-9 w-9 p-0"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {navItems.map((item) => {
                // Hide protected routes for non-authenticated users
                if (item.requireAuth && !isAuthenticated) {
                  return null;
                }

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "block px-3 py-2 text-base font-medium transition-colors hover:text-primary hover:bg-accent",
                      location.pathname === item.href
                        ? "text-primary bg-accent"
                        : "text-muted-foreground",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Content Management - only show for authenticated users */}
              {isAuthenticated && (
                <div className="border-t pt-2">
                  {contentItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "block px-3 py-2 text-base font-medium transition-colors hover:text-primary hover:bg-accent",
                        location.pathname === item.href
                          ? "text-primary bg-accent"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {/* Admin Panel - only show for admin users */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={cn(
                        "block px-3 py-2 text-base font-medium transition-colors hover:text-primary hover:bg-accent",
                        location.pathname === "/admin"
                          ? "text-primary bg-accent"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              )}

              {/* Authentication Section for Mobile */}
              {isAuthenticated ? (
                <div className="border-t pt-2">
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {user?.full_name ? (
                            getInitials(user.full_name)
                          ) : (
                            <UserCircle className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                        {isAdmin && (
                          <p className="text-xs text-orange-600 font-medium">
                            Administrator
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start px-3 py-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-2 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-full justify-start px-3 py-2"
                  >
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Log in
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="w-full justify-start px-3 py-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Sign up
                    </Link>
                  </Button>
                </div>
              )}

              <div className="px-3 py-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toggleTheme();
                    setIsOpen(false);
                  }}
                  className="w-full justify-start p-0 h-auto"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-2" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2" />
                  Toggle theme
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
