// Task #263 + #268 + #298: small "Directions" deep-link button shown on every
// location card. Opens a popover with Google Maps / Waze / Apple Maps (mac/iOS
// only) links. Hidden when the location's stored address doesn't look like a
// full street address (street name + house number) — see Task #298 for the
// gating rationale.
import { Navigation } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/hooks/use-language";
import { SiGooglemaps, SiWaze, SiApple } from "react-icons/si";
import { looksLikeStreetAddress } from "@/lib/address-heuristic";

interface DirectionsButtonProps {
  address?: string | null;
  // Task #298: kept for backwards-compat with existing call sites, but the
  // primary gate is now the address heuristic. `hasCoords === false` is still
  // honoured as a secondary suppression signal.
  hasCoords?: boolean;
  variant?: "dark" | "light";
}

type Platform = "ios" | "android" | "mac" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Macintosh|Mac OS/i.test(ua)) return "mac";
  return "other";
}

// Task #298: rewritten native-app deep-link flow. The previous hidden-iframe
// trick is widely blocked on modern mobile browsers and was leaving users on
// blank tabs. Standard pattern instead: nudge the OS to the native scheme via
// `window.location.href`; if the app picks it up the document becomes hidden,
// and we cancel the https fallback. Otherwise we open the web version after a
// short delay.
function openNativeWithFallback(nativeUrl: string, httpsFallback: string): void {
  let switchedAway = false;
  const onVisibility = () => {
    if (document.hidden) switchedAway = true;
  };
  document.addEventListener("visibilitychange", onVisibility);
  try {
    window.location.href = nativeUrl;
  } catch {
    /* noop — fallback below will run */
  }
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    if (switchedAway || document.hidden) return;
    try {
      window.open(httpsFallback, "_blank", "noopener,noreferrer");
    } catch {
      try { window.location.href = httpsFallback; } catch { /* noop */ }
    }
  }, 1200);
}

export function DirectionsButton({ address, hasCoords, variant = "dark" }: DirectionsButtonProps) {
  const { t } = useLanguage();
  const trimmed = address?.trim();
  if (!trimmed) return null;
  // Task #298: primary gate — only render when the address itself looks like a
  // real street address (street + number). City-only / neighborhood / free-text
  // entries never get a Directions link, even if coords were saved.
  if (!looksLikeStreetAddress(trimmed)) return null;
  // Secondary guard: keep older suppression where the geocoder explicitly
  // failed to find any coords (e.g. very ambiguous input).
  if (hasCoords === false) return null;

  const encoded = encodeURIComponent(trimmed);
  const googleHttps = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  const wazeHttps = `https://www.waze.com/ul?q=${encoded}&navigate=yes`;
  const appleHttps = `https://maps.apple.com/?daddr=${encoded}`;

  const platform = detectPlatform();
  // Native schemes — only used on iOS. On Android we let the https URL navigate
  // normally so Chrome's intent system can offer "Open in Maps app".
  const googleNative = platform === "ios" ? `comgooglemaps://?daddr=${encoded}&directionsmode=driving` : null;
  const wazeNative = platform === "ios" ? `waze://?q=${encoded}&navigate=yes` : null;
  const appleNative = platform === "ios" ? `maps://?daddr=${encoded}` : null;

  const onMapClick = (nativeUrl: string | null, httpsUrl: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nativeUrl) {
      // Desktop / Android / unknown — let the anchor's https href + target
      // _blank handle navigation normally. No preventDefault, so middle-click
      // and right-click "open in new tab" keep working.
      return;
    }
    // iOS — prevent the default web navigation so the user isn't dropped on a
    // blank tab while the native app launches.
    e.preventDefault();
    openNativeWithFallback(nativeUrl, httpsUrl);
  };

  const triggerClass =
    variant === "dark"
      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
      : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors";

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const showApple = platform === "ios" || platform === "mac";

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
            href={googleHttps}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMapClick(googleNative, googleHttps)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
            data-testid="link-directions-google"
          >
            <SiGooglemaps className="h-4 w-4 text-[#4285F4]" />
            <span>{t("googleMaps")}</span>
          </a>
          <a
            href={wazeHttps}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMapClick(wazeNative, wazeHttps)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
            data-testid="link-directions-waze"
          >
            <SiWaze className="h-4 w-4 text-[#33CCFF]" />
            <span>{t("waze")}</span>
          </a>
          {showApple && (
            <a
              href={appleHttps}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMapClick(appleNative, appleHttps)}
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
