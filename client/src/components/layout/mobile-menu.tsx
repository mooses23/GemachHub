import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  const [regionsOpen, setRegionsOpen] = useState(false);
  const { user, isOperator, isAdmin, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden mt-4 pb-4">
      <nav className="flex flex-col space-y-4">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          Home
        </Link>
        
        <button
          className="flex items-center justify-between font-medium text-neutral-700 hover:text-primary transition-colors"
          onClick={() => setRegionsOpen(!regionsOpen)}
        >
          Find a Gemach
          {regionsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {regionsOpen && (
          <div className="pl-4 flex flex-col space-y-2 mt-1">
            <Link
              href="/locations?region=united-states"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-700 hover:text-primary"
            >
              United States
            </Link>
            <Link
              href="/locations?region=canada"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-700 hover:text-primary"
            >
              Canada
            </Link>
            <Link
              href="/locations?region=australia"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-700 hover:text-primary"
            >
              Australia
            </Link>
            <Link
              href="/locations?region=europe"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-700 hover:text-primary"
            >
              Europe
            </Link>
            <Link
              href="/locations?region=israel"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-700 hover:text-primary"
            >
              Israel
            </Link>
          </div>
        )}
        
        <Link
          href="/#how-it-works"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          How It Works
        </Link>
        
        <Link
          href="/borrow"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          Borrow Earmuffs
        </Link>
        
        <Link
          href="/apply"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          Open a Gemach
        </Link>
        
        <Link
          href="/contact"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          Contact
        </Link>
        
        {/* Auth Buttons */}
        {user ? (
          <>
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
