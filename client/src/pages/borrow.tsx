import { BorrowForm } from "@/components/transactions/borrow-form";
import { useLanguage } from "@/hooks/use-language";

export default function Borrow() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">{t("borrowEarmuffsTitle")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("borrowPageSubtitle")}
            </p>
          </div>

          <BorrowForm />

          <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{t("howOurGemachWorks")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-primary mb-2">{t("step1FindLocation")}</h3>
                <p className="text-sm text-muted-foreground">{t("step1FindLocationDesc")}</p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">{t("step2PayDeposit")}</h3>
                <p className="text-sm text-muted-foreground">{t("step2PayDepositDesc")}</p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">{t("step3UseAndReturn")}</h3>
                <p className="text-sm text-muted-foreground">{t("step3UseAndReturnDesc")}</p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">{t("step4GetRefund")}</h3>
                <p className="text-sm text-muted-foreground">{t("step4GetRefundDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
