import { useEffect } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Contact() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "Contact Baby Banz Earmuffs Gemach | Get In Touch";
  }, []);

  return (
    <>
      <section className="py-12 sm:py-16 bg-primary/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-3 sm:mb-4">{t("contactUs")}</h1>
            <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-3xl mx-auto">
              {t("contactDescription")}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto px-3 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Email */}
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="mb-3 sm:mb-4 text-primary text-2xl sm:text-3xl">
                    <Mail className="h-8 w-8 mx-auto" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{t("emailUs")}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-neutral-600">
                    <a href="mailto:earmuffsgemach@gmail.com" className="hover:text-primary transition-colors">earmuffsgemach@gmail.com</a>
                  </p>
                </CardContent>
              </Card>
              
              {/* Hours */}
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="mb-3 sm:mb-4 text-primary text-2xl sm:text-3xl">
                    <Clock className="h-8 w-8 mx-auto" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{t("responseHours")}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-neutral-600">
                    {t("responseHoursDescription")}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{t("sendUsMessage")}</h3>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
