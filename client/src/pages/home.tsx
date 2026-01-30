import { Link } from "wouter";
import { HierarchicalLocationSearch } from "@/components/locations/hierarchical-location-search";
import { useLanguage } from "@/hooks/use-language";
import logoImage from "@assets/BabyBanz_Gemach_1769321439923.jpg";
import { MapPin, Phone, RotateCcw } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-white">
        {/* Dedication Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b border-amber-200/60">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.2),transparent_70%)]"></div>
          </div>
          <div className="relative py-3 px-4 md:px-8 text-center">
            <p className="text-lg md:text-xl font-serif text-amber-800 tracking-wide" dir="rtl">
              לזכות רפואה שלימה לרבקה ברכה בת חנה שרה
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/40 to-transparent"></div>
          
          <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
            <div className="text-center max-w-4xl mx-auto mb-8 md:mb-12">
              <div className="mb-6">
                <img 
                  src={logoImage} 
                  alt="BabyBanz Gemach" 
                  className="w-32 h-32 md:w-44 md:h-44 mx-auto object-contain rounded-xl shadow-lg border-4 border-white"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4 md:mb-6 leading-tight">
                {t("findBabyEarmuffsNearYou")}
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-6 md:mb-8 max-w-2xl mx-auto">
                {t("homeHeroDescription")}
              </p>
            </div>

            {/* Location Search Card */}
            <div id="location-search" className="bg-white rounded-2xl p-4 md:p-8 shadow-xl border border-slate-200/60 max-w-6xl mx-auto">
              <HierarchicalLocationSearch />
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="bg-white py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-3 md:mb-4">
                {t("howItWorks")}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                {t("howItWorksDescription")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-5xl mx-auto">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-sky-50 to-white border border-sky-100 hover:shadow-lg transition-shadow">
                <div className="bg-sky-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <MapPin className="h-7 w-7 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{t("findALocation")}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t("findLocationDescription")}
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-emerald-50 to-white border border-emerald-100 hover:shadow-lg transition-shadow">
                <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <Phone className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{t("contactAndReserve")}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t("contactReserveDescription")}
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-violet-50 to-white border border-violet-100 hover:shadow-lg transition-shadow">
                <div className="bg-violet-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <RotateCcw className="h-7 w-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{t("protectAndReturn")}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t("protectReturnDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-800 to-sky-700 text-white py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-5">
              {t("wantToOpenLocation")}
            </h2>
            <p className="text-lg md:text-xl text-sky-100 mb-6 md:mb-10 max-w-2xl mx-auto">
              {t("wantToOpenLocationDescription")}
            </p>
            <Link href="/apply">
              <button className="bg-white text-sky-800 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-sky-50 transition-colors shadow-lg hover:shadow-xl">
                {t("applyToOpenLocation")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
