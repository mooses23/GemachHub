import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Headphones } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const isActiveLink = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
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

          {/* CTA Button */}
          <Button asChild className="hidden md:inline-block">
            <Link href="/locations">Find a Gemach</Link>
          </Button>

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
