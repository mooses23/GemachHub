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
    "home.howItWorks.title": "How It Works",
    "home.howItWorks.step1.title": "Find Location",
    "home.howItWorks.step1.description": "Search our worldwide network to find a convenient location near you",
    "home.howItWorks.step2.title": "Contact & Reserve",
    "home.howItWorks.step2.description": "Call or text the location coordinator to check availability and reserve your earmuffs",
    "home.howItWorks.step3.title": "Pay Deposit",
    "home.howItWorks.step3.description": "Pay $20 refundable deposit when you pick up the earmuffs",
    "home.howItWorks.step4.title": "Return & Refund",
    "home.howItWorks.step4.description": "Return the earmuffs to get your full $20 deposit back",
    "home.faq.title": "Frequently Asked Questions",
    "home.testimonials.title": "What Parents Say",
    
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
    
    // Apply page
    "apply.title": "Become a Location Host",
    "apply.description": "Join our network and help families in your community",
    "apply.form.title": "Application Form",
    "apply.form.firstName": "First Name",
    "apply.form.lastName": "Last Name",
    "apply.form.email": "Email Address",
    "apply.form.phone": "Phone Number",
    "apply.form.address": "Address",
    "apply.form.city": "City",
    "apply.form.state": "State/Province",
    "apply.form.zipCode": "Zip/Postal Code",
    "apply.form.experience": "Tell us about your experience with community service",
    "apply.form.motivation": "Why do you want to host a gemach location?",
    "apply.form.availability": "What are your available hours?",
    
    // Contact page
    "contact.title": "Contact Us",
    "contact.description": "Get in touch with any questions or concerns",
    "contact.form.name": "Your Name",
    "contact.form.email": "Email Address",
    "contact.form.subject": "Subject",
    "contact.form.message": "Message",
    "contact.form.send": "Send Message",
    
    // Borrow page
    "borrow.steps.title": "How to Borrow",
    "borrow.steps.step1": "Choose a location near you",
    "borrow.steps.step2": "Contact the location coordinator",
    "borrow.steps.step3": "Pay $20 refundable deposit",
    "borrow.steps.step4": "Enjoy quiet time with your little one",
    "borrow.selectLocation": "Select Location",
    "borrow.deposit": "$20 Refundable Deposit",
    "borrow.reserve": "Reserve Now",
    
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
    "home.howItWorks.title": "איך זה עובד",
    "home.howItWorks.step1.title": "מצא מיקום",
    "home.howItWorks.step1.description": "חפש ברשת העולמית שלנו כדי למצוא מיקום נוח קרוב אליך",
    "home.howItWorks.step2.title": "צור קשר והזמן",
    "home.howItWorks.step2.description": "התקשר או שלח הודעה לרכז המיקום כדי לבדוק זמינות ולהזמין את האוזניות שלך",
    "home.howItWorks.step3.title": "שלם פיקדון",
    "home.howItWorks.step3.description": "שלם פיקדון של $20 הניתן להחזר כשאתה אוסף את האוזניות",
    "home.howItWorks.step4.title": "החזר וקבל החזר",
    "home.howItWorks.step4.description": "החזר את האוזניות כדי לקבל את מלוא הפיקדון של $20 בחזרה",
    "home.faq.title": "שאלות נפוצות",
    "home.testimonials.title": "מה הורים אומרים",
    
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
    
    // Apply page
    "apply.title": "הפוך למארח מיקום",
    "apply.description": "הצטרף לרשת שלנו ועזור למשפחות בקהילה שלך",
    "apply.form.title": "טופס בקשה",
    "apply.form.firstName": "שם פרטי",
    "apply.form.lastName": "שם משפחה",
    "apply.form.email": "כתובת אימייל",
    "apply.form.phone": "מספר טלפון",
    "apply.form.address": "כתובת",
    "apply.form.city": "עיר",
    "apply.form.state": "מדינה/מחוז",
    "apply.form.zipCode": "מיקוד",
    "apply.form.experience": "ספר לנו על הניסיון שלך בשירות קהילתי",
    "apply.form.motivation": "למה אתה רוצה לארח מיקום גמ\"ח?",
    "apply.form.availability": "מה השעות הזמינות שלך?",
    
    // Contact page
    "contact.title": "צור קשר",
    "contact.description": "פנה אלינו עם כל שאלה או דאגה",
    "contact.form.name": "השם שלך",
    "contact.form.email": "כתובת אימייל",
    "contact.form.subject": "נושא",
    "contact.form.message": "הודעה",
    "contact.form.send": "שלח הודעה",
    
    // Borrow page
    "borrow.steps.title": "איך לשאול",
    "borrow.steps.step1": "בחר מיקום קרוב אליך",
    "borrow.steps.step2": "צור קשר עם רכז המיקום",
    "borrow.steps.step3": "שלם פיקדון של $20 הניתן להחזר",
    "borrow.steps.step4": "תהנה מזמן שקט עם הקטן שלך",
    "borrow.selectLocation": "בחר מיקום",
    "borrow.deposit": "פיקדון $20 הניתן להחזר",
    "borrow.reserve": "הזמן עכשיו",
    
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