import { createContext, useContext, useState, ReactNode } from "react";

type Language = 'en' | 'he';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  isHebrew: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  const isHebrew = language === 'he';

  return (
    <LanguageContext.Provider value={{
      language,
      toggleLanguage,
      isHebrew
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