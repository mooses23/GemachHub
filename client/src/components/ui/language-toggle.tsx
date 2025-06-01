import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const [language, setLanguage] = useState("en");

  const toggleLanguage = () => {
    const newLang = language === "en" ? "he" : "en";
    setLanguage(newLang);
    
    // Apply RTL/LTR to document
    document.documentElement.dir = newLang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="px-3"
    >
      {language === "en" ? "🇺🇸 EN" : "🇮🇱 עב"}
    </Button>
  );
}