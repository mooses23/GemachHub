import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { translations, TranslationKey } from "@/lib/translations";

type Language = 'en' | 'he';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  isHebrew: boolean;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'he') {
      return saved;
    }
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  const isHebrew = language === 'he';

  return (
    <LanguageContext.Provider value={{
      language,
      toggleLanguage,
      isHebrew,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
