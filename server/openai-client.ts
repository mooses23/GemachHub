import OpenAI from 'openai';
import { storage } from './storage.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SITE_URL = process.env.SITE_URL || 'https://babybanzgemach.com';

const PLAYBOOK = `
ABOUT BABY BANZ GEMACH
- A global Jewish community network of free-loan organizations (gemachs) that lend baby noise-cancelling earmuffs (Banz) for use at simchas, weddings, bar/bat mitzvahs, kiddushim, fireworks, concerts, and other loud events.
- Loans are free. We collect a refundable $20 deposit per pair (some locations may differ; their dashboard shows the exact amount).
- Service is offered in English and Hebrew. Many locations have Yiddish-speaking volunteers.

KEY URLS (use the matching URL in replies, never invent a URL)
- Find a gemach near you: ${SITE_URL}/locations
- Borrow a pair (find your local gemach + reach out): ${SITE_URL}/borrow
- Open a NEW gemach location (the application form): ${SITE_URL}/apply
- Rules / how it works: ${SITE_URL}/rules
- Check application or loan status: ${SITE_URL}/status
- Contact us: ${SITE_URL}/contact

OPENING A NEW LOCATION
- Anyone wishing to start a Baby Banz Gemach in their community fills out the application at ${SITE_URL}/apply.
- The application asks for the prospective operator's name, contact info, address, and city/country.
- An admin reviews the application; once approved, we email the new operator their location code, dashboard login link, and starting PIN.
- We do NOT instruct people to "fill out the contact form" for new-location requests — direct them to /apply.

DEPOSIT & RETURN FLOW
- Borrower picks up the earmuffs from a local gemach operator and leaves a $20 refundable deposit (cash or whatever payment methods that location supports).
- When the borrower returns the earmuffs in good condition, the deposit is refunded in full.
- If earmuffs are not returned or are damaged, the deposit covers replacement.
- Specific deposit/refund questions for an active loan should be directed to the operator of the location they borrowed from.

OPERATOR DASHBOARD
- Each location has a dashboard at ${SITE_URL}/operator/login
- Operators sign in with their location code + PIN.
- New operators get the temporary PIN 1234, which they should change after their first login.

ESCALATION TRIGGERS — when ANY of these are present, do not pretend the issue is resolved. Draft a careful reply but FLAG for human review:
- Anger, frustration, threats, legal language, or formal complaints
- Money disputes (lost deposit, double-charge, refund not received)
- Lost / damaged / stolen items
- Privacy or safety concerns
- Press, partnership, or fundraising inquiries
- Any request for a refund or chargeback
`.trim();

type Classification =
  | 'new_location'
  | 'borrow_request'
  | 'return_or_deposit'
  | 'application_status'
  | 'general_question'
  | 'complaint'
  | 'other';

async function gatherContext(emailBody: string, senderName: string, senderEmail?: string): Promise<string> {
  const facts: string[] = [];
  try {
    const apps = await storage.getAllApplications();
    if (senderEmail) {
      const match = apps.find((a: any) =>
        a?.email && String(a.email).toLowerCase() === senderEmail.toLowerCase()
      );
      if (match) {
        facts.push(`This sender has an existing application in our system: status="${match.status}", submitted "${match.streetAddress || ''} ${match.city || ''} ${match.country || ''}".`);
      }
    }
    const lower = emailBody.toLowerCase();
    const allLocations = await storage.getAllLocations();
    const cityHit = allLocations.find((l: any) => {
      const hay = `${l.address || ''} ${l.name || ''}`.toLowerCase();
      return hay && lower.includes((l.name || '').toLowerCase()) && (l.name || '').length > 3;
    });
    if (cityHit) {
      facts.push(`A nearby active location is "${cityHit.name}" (${cityHit.address}), contact ${cityHit.contactPerson} <${cityHit.email}>.`);
    }
  } catch {
    // Best-effort context only; never fail the draft if DB lookup hiccups.
  }
  return facts.length ? `RELEVANT CONTEXT FROM OUR SYSTEM:\n- ${facts.join('\n- ')}` : 'RELEVANT CONTEXT FROM OUR SYSTEM: (none found)';
}

export interface GeneratedEmailResponse {
  draft: string;
  classification: Classification;
  needsHumanReview: boolean;
  reviewReason?: string;
}

export async function generateEmailResponse(
  emailSubject: string,
  emailBody: string,
  senderName: string,
  senderEmail?: string
): Promise<GeneratedEmailResponse> {
  const context = await gatherContext(emailBody, senderName, senderEmail);

  const systemPrompt = `You are a warm, knowledgeable representative of Baby Banz Gemach drafting an email reply on behalf of the gemach team.

${PLAYBOOK}

WRITING STYLE
- Friendly, respectful, concise (4-10 sentences). No corporate jargon.
- Match the language the sender wrote in (English or Hebrew). If Hebrew, write in fluent, natural Hebrew.
- Use the right URL from KEY URLS above for the action you are recommending. Never invent URLs.
- Sign off as "Baby Banz Gemach" (or the Hebrew equivalent if writing in Hebrew).
- The human admin will review and edit before sending — your draft should be ready-to-send, not a template with placeholders.

YOUR JOB
1. Classify the inquiry into one of: new_location, borrow_request, return_or_deposit, application_status, general_question, complaint, other.
2. Decide if it needs human review (any escalation trigger above, or if you are missing information you cannot reasonably guess).
3. Draft the reply.

OUTPUT FORMAT — return STRICT JSON only, no markdown fences:
{
  "classification": "new_location" | "borrow_request" | "return_or_deposit" | "application_status" | "general_question" | "complaint" | "other",
  "needsHumanReview": true | false,
  "reviewReason": "short reason if needsHumanReview is true, otherwise empty string",
  "draft": "the full email body text, including greeting and sign-off"
}`;

  const userPrompt = `${context}

INCOMING EMAIL
From: ${senderName}${senderEmail ? ` <${senderEmail}>` : ''}
Subject: ${emailSubject}

${emailBody}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1200,
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content || '{}';
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      draft: raw,
      classification: 'other',
      needsHumanReview: true,
      reviewReason: 'Unable to parse AI response.',
    };
  }

  return {
    draft: String(parsed.draft || 'Unable to generate response.'),
    classification: (parsed.classification as Classification) || 'other',
    needsHumanReview: !!parsed.needsHumanReview,
    reviewReason: parsed.needsHumanReview ? String(parsed.reviewReason || 'Flagged for review.') : undefined,
  };
}

export async function translateText(
  text: string,
  targetLanguage: 'en' | 'he'
): Promise<string> {
  const targetName = targetLanguage === 'he' ? 'Hebrew' : 'English';
  const systemPrompt = `You are a faithful translator. Translate the user's message into ${targetName}.
Preserve formatting, line breaks, names, and email-style structure (greetings, signatures, paragraphs).
Do not add commentary, do not summarize, do not include the source text — output only the translation.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    max_tokens: 1500,
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content?.trim() || text;
}
