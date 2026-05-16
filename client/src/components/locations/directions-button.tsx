// Task #263: small "Directions" deep-link button shown on every location card.
// Opens a popover with Google Maps / Waze / Apple Maps (mac/iOS only) links.
// Hidden entirely when the location has no postal address.
import { Navigation } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/hooks/use-language";
import { SiGooglemaps, SiWaze, SiApple } from "react-icons/si";

interface DirectionsButtonProps {
  address?: string | null;
  variant?: "dark" | "light";
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh|Mac OS/i.test(navigator.userAgent);
}

export function DirectionsButton({ address, variant = "dark" }: DirectionsButtonProps) {
  const { t } = useLanguage();
  const trimmed = address?.trim();
  if (!trimmed) return null;

  const encoded = encodeURIComponent(trimmed);
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  const wazeUrl = `https://www.waze.com/ul?q=${encoded}&navigate=yes`;
  const appleUrl = `https://maps.apple.com/?q=${encoded}`;

  const triggerClass =
    variant === "dark"
      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
      : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div onClick={stop} data-contact-actions>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={triggerClass}
            aria-label={t("directions")}
            data-testid="button-directions"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>{t("directions")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-2"
          align="end"
          onClick={stop}
        >
          <div className="text-xs font-semibold text-slate-500 px-2 py-1.5">
            {t("openInMaps")}
          </div>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
            data-testid="link-directions-google"
          >
            <SiGooglemaps className="h-4 w-4 text-[#4285F4]" />
            <span>{t("googleMaps")}</span>
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
            data-testid="link-directions-waze"
          >
            <SiWaze className="h-4 w-4 text-[#33CCFF]" />
            <span>{t("waze")}</span>
          </a>
          {isAppleDevice() && (
            <a
              href={appleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
              data-testid="link-directions-apple"
            >
              <SiApple className="h-4 w-4 text-slate-700" />
              <span>{t("appleMaps")}</span>
            </a>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Formats a kilometre distance into a localised "X mi away" / "X ק"מ ממך"
// string. Uses EN/HE convention: en → miles, he → kilometres.
export function formatDistance(distanceKm: number, language: "en" | "he", t: (k: string) => string): string {
  if (!Number.isFinite(distanceKm)) return "";
  const useMiles = language === "en";
  const value = useMiles ? distanceKm * 0.621371 : distanceKm;
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  const template = useMiles ? t("distanceMi") : t("distanceKm");
  return template.replace("{n}", String(rounded));
}
