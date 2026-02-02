import { useLanguage } from "@/hooks/use-language";
import { Heart, Clock, Sparkles, RotateCcw, HandHeart } from "lucide-react";

export default function Rules() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="glow-orb-blue top-20 -left-40 animate-float opacity-40"></div>
      <div className="glow-orb-teal top-1/3 -right-32 animate-float-delayed opacity-30"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-glow">
              {t("ourRules")}
            </h1>
            <p className="text-slate-400 text-lg">
              Simple guidelines to help everyone enjoy our gemach
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="glass-card glass-highlight rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-start gap-4">
                <div className="glass-icon-blue rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t("depositPolicy")}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    {t("depositPolicyDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card glass-highlight rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-start gap-4">
                <div className="glass-icon-teal rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t("borrowingPeriod")}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    {t("borrowingPeriodDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card glass-highlight rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-start gap-4">
                <div className="glass-icon-violet rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t("careInstructions")}
                  </h2>
                  <ul className="text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                      {t("careInstruction1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                      {t("careInstruction2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                      {t("careInstruction3")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                      {t("careInstruction4")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass-card glass-highlight rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-start gap-4">
                <div className="rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 bg-amber-500/20 border border-amber-500/30">
                  <RotateCcw className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t("returnPolicy")}
                  </h2>
                  <ul className="text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {t("returnInstruction1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {t("returnInstruction2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {t("returnInstruction3")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {t("returnInstruction4")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass-card glass-highlight rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01] border border-emerald-500/20">
              <div className="flex items-start gap-4">
                <div className="rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 bg-emerald-500/20 border border-emerald-500/30">
                  <HandHeart className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t("responsibility")}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    {t("responsibilityDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10 pt-8 border-t border-slate-700/50">
            <p className="text-slate-400">
              {t("rulesQuestion")}{" "}
              <a href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                {t("contactUsForClarification")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
