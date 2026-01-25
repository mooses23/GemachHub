import { Link } from "wouter";
import { HierarchicalLocationSearch } from "@/components/locations/hierarchical-location-search";
import { useLanguage } from "@/hooks/use-language";
import logoImage from "@assets/BabyBanz_Gemach_1769321439923.jpg";

export default function Home() {
  const { t } = useLanguage();
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Dedication Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b-2 border-amber-200">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.3),transparent_70%)]"></div>
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-300 text-2xl">✡</div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300 text-2xl">✡</div>
          <div className="relative py-4 px-8 text-center">
            <p className="text-xl md:text-2xl font-serif text-amber-800 tracking-wide" dir="rtl">
              לזכות רפואה שלימה לרבקה ברכה בת חנה שרה
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-white"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 py-16">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <img 
                src={logoImage} 
                alt="BabyBanz Gemach" 
                className="w-48 h-48 mx-auto mb-6 object-contain rounded-lg"
              />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                {t("findBabyEarmuffsNearYou")}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {t("homeHeroDescription")}
              </p>
            </div>

            {/* Hierarchical Location Search */}
            <div id="location-search" className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 max-w-6xl mx-auto mt-8">
              <HierarchicalLocationSearch />
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t("howItWorks")}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t("howItWorksDescription")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("findALocation")}</h3>
                <p className="text-gray-600">
                  {t("findLocationDescription")}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📞</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("contactAndReserve")}</h3>
                <p className="text-gray-600">
                  {t("contactReserveDescription")}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👶</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("protectAndReturn")}</h3>
                <p className="text-gray-600">
                  {t("protectReturnDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="bg-blue-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t("wantToOpenLocation")}
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {t("wantToOpenLocationDescription")}
            </p>
            <Link href="/apply">
              <button className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {t("applyToOpenLocation")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}