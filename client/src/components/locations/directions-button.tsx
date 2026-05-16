// Task #263 + #268: small "Directions" deep-link button shown on every location
// card. Opens a popover with Google Maps / Waze / Apple Maps (mac/iOS only)
// links. Hidden when the location has no postal address — or, per Task #268,
// when we don't have a precise (street-level) coordinate for it yet.
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
  // Task #268: cards pass this in so the button stays hidden when the gemach
  // only has an area-level address (no precise lat/lng from the geocoder).
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

// Task #268: native deep links — open the actual map app on mobile instead of
// bouncing through the browser. We try the native scheme first; if the app
// takes over (page hides) we stop there. Otherwise we open the https
// fallback in a new tab after a short delay so the user still gets directions.
function openWithFallback(nativeUrl: string, httpsFallback: string): void {
  const start = Date.now();
  let cancelled = false;
  // If the app launches, the document becomes hidden as the OS switches
  // away. Use that signal to cancel the https fallback.
  const onVisibility = () => {
    if (document.hidden) cancelled = true;
  };
  document.addEventListener("visibilitychange", onVisibility);
  try {
    // Hidden iframe avoids replacing the current page if the scheme is
    // unsupported (Android Chrome handles this gracefully on Android too).
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = nativeUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* noop */ }
    }, 1200);
  } catch {
    try { window.location.href = nativeUrl; } catch { /* noop */ }
  }
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    if (cancelled) return;
    // Native app didn't pick it up — open the web version instead.
    if (Date.now() - start < 1800) {
      try { window.open(httpsFallback, "_blank", "noopener,noreferrer"); } catch { /* noop */ }
    }
  }, 1500);
}

export function DirectionsButton({ address, hasCoords, variant = "dark" }: DirectionsButtonProps) {
  const { t } = useLanguage();
  const trimmed = address?.trim();
  if (!trimmed) return null;
  // Task #268: suppress when the geocoder didn't get a precise fix. Falsy
  // (undefined/false/null) → hide. Older call sites that don't pass this prop
  // would also hide; we update them at the same time so they still render.
  if (hasCoords === false) return null;

  const encoded = encodeURIComponent(trimmed);
  const googleHttps = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  const wazeHttps = `https://www.waze.com/ul?q=${encoded}&navigate=yes`;
  const appleHttps = `https://maps.apple.com/?q=${encoded}`;

  const platform = detectPlatform();
  const googleNative =
    platform === "ios" ? `comgooglemaps://?daddr=${encoded}&directionsmode=driving` :
    platform === "android" ? `geo:0,0?q=${encoded}` :
    null;
  const wazeNative =
    platform === "ios" || platform === "android"
      ? `waze://?q=${encoded}&navigate=yes`
      : null;
  const appleNative = platform === "ios" ? `maps://?daddr=${encoded}` : null;

  const onMapClick = (nativeUrl: string | null, httpsUrl: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nativeUrl) {
      // Desktop / unknown platform — let the anchor's https href + target
      // _blank handle it normally. (No preventDefault.)
      return;
    }
    // Mobile — prevent the browser tab so the user doesn't end up with both
    // the native app and a duplicate web page. openWithFallback opens the
    // web version only if the native app didn't take over.
    e.preventDefault();
    openWithFallback(nativeUrl, httpsUrl);
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
