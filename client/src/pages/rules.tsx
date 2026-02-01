import { useLanguage } from "@/hooks/use-language";

export default function Rules() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
              {t("ourRules")}
            </h1>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2 sm:mb-3">
                  {t("depositPolicy")}
                </h2>
                <p className="text-sm sm:text-base text-blue-800">
                  {t("depositPolicyDescription")}
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-green-900 mb-2 sm:mb-3">
                  {t("borrowingPeriod")}
                </h2>
                <p className="text-sm sm:text-base text-green-800">
                  {t("borrowingPeriodDescription")}
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-amber-900 mb-2 sm:mb-3">
                  {t("careInstructions")}
                </h2>
                <ul className="text-sm sm:text-base text-amber-800 space-y-1 sm:space-y-2">
                  <li>• {t("careInstruction1")}</li>
                  <li>• {t("careInstruction2")}</li>
                  <li>• {t("careInstruction3")}</li>
                  <li>• {t("careInstruction4")}</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-red-900 mb-2 sm:mb-3">
                  {t("returnPolicy")}
                </h2>
                <ul className="text-sm sm:text-base text-red-800 space-y-1 sm:space-y-2">
                  <li>• {t("returnInstruction1")}</li>
                  <li>• {t("returnInstruction2")}</li>
                  <li>• {t("returnInstruction3")}</li>
                  <li>• {t("returnInstruction4")}</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-purple-900 mb-2 sm:mb-3">
                  {t("responsibility")}
                </h2>
                <p className="text-sm sm:text-base text-purple-800">
                  {t("responsibilityDescription")}
                </p>
              </div>

              <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-xs sm:text-sm md:text-base text-gray-600">
                  {t("rulesQuestion")} <a href="/contact" className="text-primary hover:underline font-medium">{t("contactUsForClarification")}</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
