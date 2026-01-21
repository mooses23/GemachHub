import React, { useState, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { Headphones, ChevronDown, User, LogOut, LayoutDashboard, Languages } from "lucide-react";
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
import { useLanguage } from "@/hooks/use-language";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading, logoutMutation, isOperator, isAdmin } = useAuth();
  const { language, toggleLanguage, isHebrew, t } = useLanguage();

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
        <div className="flex items-center justify-between">
          {/* Logo and Title - Left */}
          <div className="flex items-center space-x-2 md:space-x-3 ml-2 md:ml-8">
            <Link href="/" className="flex items-center space-x-2 md:space-x-3">
              <div className="text-blue-600 bg-blue-50 rounded-full p-1.5 md:p-2">
                <Headphones className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-blue-600 hidden sm:block">
                {t("babyBanzGemach")}
              </h1>
              <h1 className="text-sm font-bold text-blue-600 sm:hidden">
                {t("babyBanz")}
              </h1>
            </Link>
          </div>

          {/* Navigation - Right */}
          <div className="flex justify-end items-center">
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <Link
                href="/"
                className={`font-medium ${
                  isActiveLink("/")
                    ? "text-primary"
                    : "text-neutral-700 hover:text-primary"
                } transition-colors`}
              >
                {t("home")}
              </Link>
              
              <Link
                href="/self-deposit"
                className={`font-medium ${
                  isActiveLink("/self-deposit")
                    ? "text-primary"
                    : "text-neutral-700 hover:text-primary"
                } transition-colors`}
              >
                {t("selfDeposit")}
              </Link>
              
              <Link
                href="/rules"
                className={`font-medium ${
                  isActiveLink("/rules")
                    ? "text-primary"
                    : "text-neutral-700 hover:text-primary"
                } transition-colors`}
              >
                {t("ourRules")}
              </Link>
              
              <Link
                href="/apply"
                className={`font-medium ${
                  isActiveLink("/apply")
                    ? "text-primary"
                    : "text-neutral-700 hover:text-primary"
                } transition-colors`}
              >
                {t("openLocation")}
              </Link>
              
              <Link
                href="/contact"
                className={`font-medium ${
                  isActiveLink("/contact")
                    ? "text-primary"
                    : "text-neutral-700 hover:text-primary"
                } transition-colors`}
              >
                {t("contact")}
              </Link>

              {/* Language Toggle Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 px-3 py-1.5">
                    <Languages className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isHebrew ? "עברית" : "English"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2"
                  >
                    <Languages className="h-4 w-4" />
                    {isHebrew ? "English" : "עברית"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth Buttons */}
              {isLoading ? (
                <div className="w-8 h-8" />
              ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.firstName}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOperator && (
                        <DropdownMenuItem asChild>
                          <Link href="/operator/dashboard" className="flex items-center gap-2 w-full">
                            <LayoutDashboard className="h-4 w-4" />
                            {t("operatorDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard" className="flex items-center gap-2 w-full">
                            <LayoutDashboard className="h-4 w-4" />
                            {t("adminDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                        <LogOut className="h-4 w-4" />
                        {t("logOut")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild>
                    <Link href="/auth">{t("operatorPin")} / {t("adminLogin")}</Link>
                  </Button>
                )}
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
      </div>
    </header>
  );
}