import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, LogOut, LayoutDashboard, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  const { user, isOperator, isAdmin, logoutMutation } = useAuth();
  const { language, toggleLanguage, isHebrew } = useLanguage();

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
      <nav className="flex flex-col space-y-2 pt-4">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          Home
        </Link>
        
        <Link
          href="/self-deposit"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          Self Deposit
        </Link>
        
        <Link
          href="/rules"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          Our Rules
        </Link>
        
        <Link
          href="/apply"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          Open Location
        </Link>
        
        <Link
          href="/contact"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          Contact
        </Link>
        
        <Link
          href="/auth"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          Login
        </Link>
        
        {/* Auth Buttons */}
        {user ? (
          <>
            {isOperator && (
              <>
                <Link
                  href="/operator/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="font-medium text-neutral-700 hover:text-primary transition-colors"
                >
                  Operator Dashboard
                </Link>
                <Link
                  href="/operator/deposits"
                  onClick={() => setIsOpen(false)}
                  className="font-medium text-neutral-700 hover:text-primary transition-colors"
                >
                  Deposit Management
                </Link>
              </>
            )}
            {isOperator && (
              <Button
                variant="outline"
                asChild
                className="text-center flex items-center justify-center"
              >
                <Link 
                  href="/operator/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Operator Dashboard
                </Link>
              </Button>
            )}
            
            {isAdmin && (
              <Button
                variant="outline"
                asChild
                className="text-center flex items-center justify-center"
              >
                <Link 
                  href="/admin/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
            
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="text-center flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </>
        ) : (
          <Button
            asChild
            className="text-center"
          >
            <Link href="/auth" onClick={() => setIsOpen(false)}>
              Log In / Register
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
