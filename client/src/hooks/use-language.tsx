import { createContext, ReactNode, useContext, useState } from "react";

type Language = "en" | "he";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.locations": "Locations",
    "nav.borrow": "Borrow",
    "nav.apply": "Apply",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.dashboard": "Dashboard",
    
    // Home page
    "home.hero.title": "Baby Banz Earmuffs Gemach",
    "home.hero.subtitle": "Protecting little ears worldwide with free earmuff lending",
    "home.hero.description": "Access noise-reducing earmuffs for babies and children across our global network of locations. $20 refundable deposit ensures safe returns.",
    "home.hero.findLocation": "Find a Location",
    "home.hero.learnMore": "Learn More",
    
    // Locations
    "locations.title": "Find a Location Near You",
    "locations.description": "Browse our worldwide network of Baby Banz Earmuffs locations",
    "locations.search": "Search by city, zip code, or location name...",
    "locations.mapView": "Map View",
    "locations.listView": "List View",
    "locations.showingResults": "Showing {count} locations",
    "locations.contact": "Contact",
    "locations.inventory": "Available: {count} pairs",
    "locations.getDirections": "Get Directions",
    
    // Borrow page
    "borrow.title": "Borrow Earmuffs",
    "borrow.description": "Select a location and reserve your earmuffs",
    "borrow.selectLocation": "Select Location",
    "borrow.deposit": "$20 Refundable Deposit",
    "borrow.reserve": "Reserve Now",
    
    // Apply page
    "apply.title": "Become a Location Host",
    "apply.description": "Join our network and help families in your community",
    
    // Contact page
    "contact.title": "Contact Us",
    "contact.description": "Get in touch with any questions or concerns",
    
    // Footer
    "footer.description": "Protecting children's hearing worldwide through our community-driven earmuff lending network.",
    "footer.quickLinks": "Quick Links",
    "footer.contact": "Contact",
    "footer.email": "Email",
    "footer.phone": "Phone",
    "footer.social": "Follow Us",
    "footer.copyright": "© 2025 Baby Banz Earmuffs Gemach. All rights reserved.",
    
    // Common
    "common.loading": "Loading...",
    "common.search": "Search",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.view": "View",
  },
  he: {
    // Navigation
    "nav.home": "בית",
    "nav.locations": "מיקומים",
    "nav.borrow": "השאלה",
    "nav.apply": "הצטרפות",
    "nav.contact": "צור קשר",
    "nav.login": "התחברות",
    "nav.logout": "התנתקות",
    "nav.dashboard": "לוח בקרה",
    
    // Home page
    "home.hero.title": "גמ\"ח אוזניות בייבי באנז",
    "home.hero.subtitle": "מגנים על אוזני הקטנים ברחבי העולם עם השאלת אוזניות חינם",
    "home.hero.description": "גישה לאוזניות מפחיתות רעש לתינוקות וילדים ברשת הגלובלית שלנו. פיקדון של $20 הניתן להחזר מבטיח החזרה בטוחה.",
    "home.hero.findLocation": "מצא מיקום",
    "home.hero.learnMore": "קרא עוד",
    
    // Locations
    "locations.title": "מצא מיקום קרוב אליך",
    "locations.description": "עיין ברשת העולמית שלנו של מיקומי אוזניות בייבי באנז",
    "locations.search": "חפש לפי עיר, מיקוד או שם מיקום...",
    "locations.mapView": "תצוגת מפה",
    "locations.listView": "תצוגת רשימה",
    "locations.showingResults": "מציג {count} מיקומים",
    "locations.contact": "צור קשר",
    "locations.inventory": "זמין: {count} זוגות",
    "locations.getDirections": "קבל הוראות הגעה",
    
    // Borrow page
    "borrow.title": "השאלת אוזניות",
    "borrow.description": "בחר מיקום והזמן את האוזניות שלך",
    "borrow.selectLocation": "בחר מיקום",
    "borrow.deposit": "פיקדון $20 הניתן להחזר",
    "borrow.reserve": "הזמן עכשיו",
    
    // Apply page
    "apply.title": "הפוך למארח מיקום",
    "apply.description": "הצטרף לרשת שלנו ועזור למשפחות בקהילה שלך",
    
    // Contact page
    "contact.title": "צור קשר",
    "contact.description": "פנה אלינו עם כל שאלה או דאגה",
    
    // Footer
    "footer.description": "מגנים על שמיעת ילדים ברחבי העולם דרך רשת השאלת האוזניות המונעת על ידי הקהילה שלנו.",
    "footer.quickLinks": "קישורים מהירים",
    "footer.contact": "צור קשר",
    "footer.email": "אימייל",
    "footer.phone": "טלפון",
    "footer.social": "עקוב אחרינו",
    "footer.copyright": "© 2025 גמ\"ח אוזניות בייבי באנז. כל הזכויות שמורות.",
    
    // Common
    "common.loading": "טוען...",
    "common.search": "חיפוש",
    "common.submit": "שלח",
    "common.cancel": "ביטול",
    "common.close": "סגור",
    "common.back": "חזור",
    "common.next": "הבא",
    "common.previous": "קודם",
    "common.save": "שמור",
    "common.edit": "ערוך",
    "common.delete": "מחק",
    "common.view": "צפה",
  }
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // fallback to key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className={language === 'he' ? 'rtl' : 'ltr'} dir={language === 'he' ? 'rtl' : 'ltr'}>
        {children}
      </div>
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