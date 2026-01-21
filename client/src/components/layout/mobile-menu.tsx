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
  const { language, toggleLanguage, isHebrew, t } = useLanguage();

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
          {t("home")}
        </Link>
        
        <Link
          href="/self-deposit"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          {t("selfDeposit")}
        </Link>
        
        <Link
          href="/rules"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          {t("ourRules")}
        </Link>
        
        <Link
          href="/apply"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          {t("openLocation")}
        </Link>
        
        <Link
          href="/contact"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50"
        >
          {t("contact")}
        </Link>
        
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="font-medium text-neutral-700 hover:text-primary transition-colors py-3 px-2 rounded-md hover:bg-gray-50 flex items-center gap-2 text-left w-full"
        >
          <Languages className="h-4 w-4" />
          {isHebrew ? t("switchToEnglishMobile") : t("switchToHebrewMobile")}
        </button>
        
        <Link
          href="/auth"
          onClick={() => setIsOpen(false)}
          className="font-medium text-neutral-700 hover:text-primary transition-colors"
        >
          {t("login")}
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
                  {t("operatorDashboard")}
                </Link>
                <Link
                  href="/operator/deposits"
                  onClick={() => setIsOpen(false)}
                  className="font-medium text-neutral-700 hover:text-primary transition-colors"
                >
                  {t("depositManagement")}
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
                  {t("operatorDashboard")}
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
                  {t("adminDashboard")}
                </Link>
              </Button>
            )}
            
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="text-center flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t("logOut")}
            </Button>
          </>
        ) : (
          <Button
            asChild
            className="text-center"
          >
            <Link href="/auth" onClick={() => setIsOpen(false)}>
              {t("login")}
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
