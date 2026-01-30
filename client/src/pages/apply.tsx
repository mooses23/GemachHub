import { useEffect } from "react";
import { ApplyForm } from "@/components/apply/apply-form";
import { useLanguage } from "@/hooks/use-language";

export default function Apply() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "Open a Baby Banz Earmuffs Gemach | Application Form";
  }, []);

  return (
    <>
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-10">
            <div className="md:w-1/2">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3 sm:mb-4">{t("openGemachInCommunity")}</h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 mb-4 sm:mb-6">
                {t("applyDescription")}
              </p>
              
              <div className="bg-neutral-100 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-3">{t("whatYoullNeed")}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm sm:text-base">{t("needSecureLocation")}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm sm:text-base">{t("needCollectDeposits")}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm sm:text-base">{t("needTimeManage")}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm sm:text-base">{t("needCommitment")}</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-primary/10 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <svg className="h-6 w-6 text-yellow-400 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{t("whyStartGemach")}</h3>
                    <p className="text-sm sm:text-base text-neutral-600">
                      {t("whyStartDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <ApplyForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
