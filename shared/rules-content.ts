export const rulesContent = {
  en: {
    depositPolicy: "About the Deposit",
    depositPolicyDescription:
      "We kindly ask for a small $20 deposit when you borrow our earmuffs. Don't worry - you'll get it all back when you return them! This just helps us keep the gemach running smoothly for everyone.",
    borrowingPeriod: "How Long You Can Borrow",
    borrowingPeriodDescription:
      "Feel free to borrow the earmuffs for up to 2 weeks. Need a little more time? Just let us know - we're happy to extend if we have enough in stock!",
    careInstructions: "A Few Gentle Reminders",
    careInstruction1: "Please keep the earmuffs clean and dry",
    careInstruction2: "Store them safely when not in use",
    careInstruction3: "Handle with care - they'll last longer for the next family",
    careInstruction4: "Please don't take them apart or modify them",
    returnPolicy: "When You're Done",
    returnInstruction1: "Please return to the same location where you borrowed",
    returnInstruction2: "A quick check for any damage is appreciated",
    returnInstruction3: "If something happens to them, please let us know - we'll work it out together",
    returnInstruction4: "Running late? No problem! Just give us a heads up",
    responsibility: "Thank You!",
    responsibilityDescription:
      "We truly appreciate you taking good care of the earmuffs and returning them on time. This helps us continue helping other families at simchas. Thank you for being part of our gemach community!",
  },
  he: {
    depositPolicy: "לגבי הפיקדון",
    depositPolicyDescription:
      'אנחנו מבקשים פיקדון קטן של $20 כשמשאילים את האוזניות. אל דאגה - תקבלו הכל בחזרה כשתחזירו! זה רק עוזר לנו לנהל את הגמ"ח בצורה חלקה לטובת כולם.',
    borrowingPeriod: "כמה זמן אפשר להשאיל",
    borrowingPeriodDescription:
      "בבקשה השאילו את האוזניות עד שבועיים. צריכים קצת יותר זמן? פשוט ספרו לנו - נשמח להאריך אם יש מספיק במלאי!",
    careInstructions: "כמה תזכורות נעימות",
    careInstruction1: "בבקשה שמרו על האוזניות נקיות ויבשות",
    careInstruction2: "אחסנו בבטחה כשלא בשימוש",
    careInstruction3: "טפלו בזהירות - ככה הן יחזיקו מעמד למשפחה הבאה",
    careInstruction4: "בבקשה אל תפרקו או תשנו אותן",
    returnPolicy: "כשסיימתם",
    returnInstruction1: "בבקשה החזירו לאותו סניף שממנו השאלתם",
    returnInstruction2: "בדיקה קצרה לנזק תתקבל בברכה",
    returnInstruction3: "אם משהו קורה להן, בבקשה ספרו לנו - נסתדר ביחד",
    returnInstruction4: "מאחרים? אין בעיה! פשוט תנו לנו הודעה",
    responsibility: "תודה רבה!",
    responsibilityDescription:
      'אנחנו באמת מעריכים שאתם שומרים על האוזניות ומחזירים בזמן. זה עוזר לנו להמשיך לעזור למשפחות אחרות בשמחות. תודה שאתם חלק מקהילת הגמ"ח שלנו!',
  },
} as const;

export type RulesLanguage = keyof typeof rulesContent;

export function buildRulesSeedBody(lang: RulesLanguage, siteUrl: string): string {
  const r = rulesContent[lang];
  if (lang === 'he') {
    return `אלו הכללים הקבועים להשאלת אוזניות Baby Banz מכל גמ"ח ברשת שלנו. מקור: ${siteUrl}/rules

${r.depositPolicy}
- ${r.depositPolicyDescription}
- חלק מהסניפים מקבלים "תשלום מאוחר יותר" עם כרטיס שמור; אם האוזניות לא מוחזרות, המפעיל רשאי לחייב את הפיקדון.

${r.borrowingPeriod}
- ${r.borrowingPeriodDescription}

${r.careInstructions}
- ${r.careInstruction1}.
- ${r.careInstruction2}.
- ${r.careInstruction3}.
- ${r.careInstruction4}.

${r.returnPolicy}
- ${r.returnInstruction1}.
- ${r.returnInstruction2}.
- ${r.returnInstruction3}.
- ${r.returnInstruction4}.

${r.responsibility}
- ${r.responsibilityDescription}

שאלות
- להבהרות, הפנו את הפונה אל ${siteUrl}/contact. אין להמציא כללים שאינם מופיעים בדף הזה.`;
  }

  return `These are the standing rules for borrowing Baby Banz earmuffs from any gemach in our network. Source: ${siteUrl}/rules

${r.depositPolicy.toUpperCase()}
- ${r.depositPolicyDescription}
- Some locations accept "pay later" via a saved card; if the earmuffs are not returned, the operator may charge the deposit.

${r.borrowingPeriod.toUpperCase()}
- ${r.borrowingPeriodDescription}

${r.careInstructions.toUpperCase()}
- ${r.careInstruction1}.
- ${r.careInstruction2}.
- ${r.careInstruction3}.
- ${r.careInstruction4}.

${r.returnPolicy.toUpperCase()}
- ${r.returnInstruction1}.
- ${r.returnInstruction2}.
- ${r.returnInstruction3}.
- ${r.returnInstruction4}.

${r.responsibility.toUpperCase()}
- ${r.responsibilityDescription}

QUESTIONS
- For clarifications, point the writer to ${siteUrl}/contact. Never invent rules that aren't on this page.`;
}
