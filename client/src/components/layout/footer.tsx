import React from "react";
import { Link } from "wouter";
import { Headphones } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/use-language";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-neutral-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-white">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-lg">{t("babyBanzEarmuffsGemach")}</span>
              </div>
            </div>
            <p className="text-neutral-300">
              {t("footerDescription")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-300 hover:text-white transition-colors">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-neutral-300 hover:text-white transition-colors">
                  {t("findAGemach")}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-neutral-300 hover:text-white transition-colors">
                  {t("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-neutral-300 hover:text-white transition-colors">
                  {t("openAGemach")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-300 hover:text-white transition-colors">
                  {t("contactUs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Regions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("regions")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/locations?region=united-states" className="text-neutral-300 hover:text-white transition-colors">
                  {t("unitedStates")}
                </Link>
              </li>
              <li>
                <Link href="/locations?region=canada" className="text-neutral-300 hover:text-white transition-colors">
                  {t("canada")}
                </Link>
              </li>
              <li>
                <Link href="/locations?region=australia" className="text-neutral-300 hover:text-white transition-colors">
                  {t("australia")}
                </Link>
              </li>
              <li>
                <Link href="/locations?region=europe" className="text-neutral-300 hover:text-white transition-colors">
                  {t("europe")}
                </Link>
              </li>
              <li>
                <Link href="/locations?region=israel" className="text-neutral-300 hover:text-white transition-colors">
                  {t("israel")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="border-neutral-700 mt-8 mb-8" />

        <div className="text-center text-neutral-400 text-sm">
          <p>© {new Date().getFullYear()} {t("babyBanzEarmuffsGemach")}. {t("allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
}
