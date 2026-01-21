import { SelfDeposit } from "@/components/home/self-deposit";
import { useLanguage } from "@/hooks/use-language";

export default function SelfDepositPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t("selfDepositTitle")}
            </h1>
            <p className="text-lg text-gray-600">
              {t("selfDepositDescription")}
            </p>
          </div>
          
          <SelfDeposit />
        </div>
      </div>
    </div>
  );
}