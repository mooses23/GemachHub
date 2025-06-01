import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Headphones, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading, logoutMutation, isOperator, isAdmin } = useAuth();

  const isActiveLink = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-primary">
              <Headphones className="h-8 w-8" />
            </div>
            <div className="hidden md:block">
              <span className="font-semibold text-lg">Baby Banz Earmuffs Gemach</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link
              href="/"
              className={`font-medium ${
                isActiveLink("/")
                  ? "text-primary"
                  : "text-neutral-700 hover:text-primary"
              } transition-colors`}
            >
              Home
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center font-medium text-neutral-700 hover:text-primary transition-colors">
                  Find a Gemach <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/locations?region=united-states" className="w-full">
                    United States
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/locations?region=canada" className="w-full">
                    Canada
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/locations?region=australia" className="w-full">
                    Australia
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/locations?region=europe" className="w-full">
                    Europe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/locations?region=israel" className="w-full">
                    Israel
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link
              href="/#how-it-works"
              className={`font-medium text-neutral-700 hover:text-primary transition-colors`}
            >
              How It Works
            </Link>
            
            <Link
              href="/borrow"
              className={`font-medium ${
                isActiveLink("/borrow")
                  ? "text-primary"
                  : "text-neutral-700 hover:text-primary"
              } transition-colors`}
            >
              Borrow Earmuffs
            </Link>
            
            <Link
              href="/apply"
              className={`font-medium ${
                isActiveLink("/apply")
                  ? "text-primary"
                  : "text-neutral-700 hover:text-primary"
              } transition-colors`}
            >
              Open a Gemach
            </Link>
            
            <Link
              href="/contact"
              className={`font-medium ${
                isActiveLink("/contact")
                  ? "text-primary"
                  : "text-neutral-700 hover:text-primary"
              } transition-colors`}
            >
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          {isLoading ? (
            <div className="w-8 h-8 hidden md:flex" />
          ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden md:flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user.firstName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOperator && (
                    <DropdownMenuItem asChild>
                      <Link href="/operator/dashboard" className="flex items-center gap-2 w-full">
                        <LayoutDashboard className="h-4 w-4" />
                        Operator Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="flex items-center gap-2 w-full">
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="hidden md:inline-block">
                <Link href="/auth">Log In / Register</Link>
              </Button>
            )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-neutral-700 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
      </div>
    </header>
  );
}
