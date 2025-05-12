import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  const [regionsOpen, setRegionsOpen] = useState(false);

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
        
        <Button
          asChild
          className="text-center"
        >
          <Link href="/locations" onClick={() => setIsOpen(false)}>
            Find a Gemach
          </Link>
        </Button>
      </nav>
    </div>
  );
}
