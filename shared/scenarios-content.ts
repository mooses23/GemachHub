export type ScenariosLanguage = 'en' | 'he';

export function buildScenariosSeedBody(lang: ScenariosLanguage, siteUrl: string): string {
  if (lang === 'he') {
    return `מדריך מהיר לתרחישים הנפוצים ביותר במייל. השתמשו בהם כבסיס לתשובות; אל תמציאו פרטים שסותרים אותם.

1. "איך משאילים זוג?"
   - הפנו את המשפחה אל ${siteUrl}/locations למצוא את הגמ״ח הקרוב, ואז אל ${siteUrl}/borrow להתחיל את תהליך ההשאלה. המפעיל המקומי יאשר את פרטי האיסוף.

2. "אני מאחר/ת בהחזרה — מה לעשות?"
   - הרגיעו, בקשו לפנות ישירות למפעיל לתאם זמן החזרה. הזכירו שהפיקדון מוחזק עד החזרה.

3. "אבדה / נזק לזוג."
   - הודו על העדכון, בקשו ליצור קשר עם המפעיל המקומי. המפעיל מחליט על ניכוי פיקדון או החלפה לפי כל מקרה. סמנו לבדיקה אנושית כשמדובר בכסף.

4. "אפשר לפתוח גמ״ח בעיר שלי?"
   - הפנו לטופס בקשה ${siteUrl}/apply. בדרך כלל נחזור תוך שבוע. אין להבטיח אישור. אל תפנו אותם לטופס "צור קשר" לבקשה הזו.

5. "איך אפשר לתרום / לשלוח אוזניות?"
   - הודו בחום. הסבירו שתרומות עוזרות לנו לשלוח אוזניות לגמ״חים חדשים. הציעו לקשר עם רכז/ת דרך ${siteUrl}/contact.

6. "לאיזה גילאים / כמה דציבלים?"
   - האוזניות מתאימות לתינוקות עד גיל ~2; ילדים גדולים יותר עשויים גם להתאים. הן מפחיתות רעש מאירועים רועשים (חתונות, זיקוקים, מופעים). אין לצטט ערך דציבלים אלא אם מופיע ב‑FAQ.

7. "לא מצליח/ה להשיג את המפעיל המקומי."
   - התנצלו, הציעו לדחוף את המפעיל. אין לשתף טלפון או מייל של המפעיל בפומבי. אמרו שהמנהל יחזור. סמנו לבדיקה אנושית.

8. "החזר כספי / חיוב כפול / ביטול עסקה."
   - אשרו קבלה, אל תבטיחו תוצאה, העלו לטיפול אנושי. תמיד לסמן לבדיקה אנושית.`;
  }

  return `Quick reference for the email scenarios that come up most often. Use these as the basis for replies; never invent details that contradict them.

1. "How do I borrow a pair?"
   - Direct the family to ${siteUrl}/locations to find the closest gemach, then to ${siteUrl}/borrow to start the borrow flow. The local operator will confirm pickup details.

2. "I'm late returning — what do I do?"
   - Reassure them, ask them to message the operator directly to arrange a return time. Mention that the deposit is held until return.

3. "I lost / damaged a pair."
   - Thank them for letting us know, ask them to contact the local operator. The operator decides on a deposit deduction or replacement on a case-by-case basis. Flag for human review when money is involved.

4. "Can I open a gemach in my city?"
   - Point them to the application at ${siteUrl}/apply. We typically follow up within a week. Don't promise approval. Do NOT tell them to use the contact form for this.

5. "How can I donate / can I send earmuffs?"
   - Thank them warmly. Explain donations help us send earmuffs to new gemachs. Offer to connect them to a coordinator via ${siteUrl}/contact.

6. "What ages / how many decibels?"
   - Earmuffs are sized for babies up to ~2 years old; older toddlers may also fit. They reduce loud-event noise (weddings, concerts, fireworks). Don't quote a specific dB rating unless it's in the FAQ.

7. "I can't reach my local operator."
   - Apologize, offer to nudge the operator. Do NOT share operator phone or email publicly. Tell the writer the admin will follow up. Flag for human review.

8. "Refund / double-charge / chargeback."
   - Acknowledge, do not promise an outcome, escalate. Always flag for human review.`;
}
