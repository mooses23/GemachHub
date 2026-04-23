import OpenAI from 'openai';
import { storage } from './storage.js';
import { getThreadMessages } from './gmail-client.js';
import type { Location, FaqEntry, PlaybookFact } from '../shared/schema.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SITE_URL = process.env.SITE_URL || 'https://babybanzgemach.com';

const STATIC_PLAYBOOK = `
ABOUT BABY BANZ GEMACH
- A global Jewish community network of free-loan organizations (gemachs) that lend baby noise-cancelling earmuffs (Banz) for use at simchas, weddings, bar/bat mitzvahs, kiddushim, fireworks, concerts, and other loud events.
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
- An admin reviews the application; once approved, we email the new operator their location code, dashboard login link, and starting PIN.
- We do NOT instruct people to "fill out the contact form" for new-location requests — direct them to /apply.

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

function tokenize(text: string): Set<string> {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^\w\u0590-\u05FF]+/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 3)
  );
}

function scoreFaqRelevance(query: string, faq: FaqEntry): number {
  const qTokens = tokenize(query);
  const fTokens = tokenize(`${faq.question} ${faq.category}`);
  let overlap = 0;
  qTokens.forEach(t => { if (fTokens.has(t)) overlap++; });
  return overlap;
}

function pickRelevantFaqs(query: string, faqs: FaqEntry[], language: 'en' | 'he', max: number = 4): FaqEntry[] {
  const candidates = faqs.filter(f => f.isActive && (f.language === language || f.language === 'en'));
  return candidates
    .map(f => ({ faq: f, score: scoreFaqRelevance(query, f) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(s => s.faq);
}

function findMatchingLocation(emailBody: string, allLocations: Location[]): Location | null {
  const lower = emailBody.toLowerCase();
  let best: { loc: Location; score: number } | null = null;
  for (const loc of allLocations) {
    const name = (loc.name || '').toLowerCase().trim();
    const address = (loc.address || '').toLowerCase().trim();
    let score = 0;
    if (name.length > 3 && lower.includes(name)) score += name.length;
    const cityCandidates = address.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 3);
    for (const c of cityCandidates) {
      if (lower.includes(c)) score = Math.max(score, c.length);
    }
    if (score > 0 && (!best || score > best.score)) best = { loc, score };
  }
  return best?.loc || null;
}

function detectLanguage(text: string): 'en' | 'he' {
  // Hebrew Unicode range
  return /[\u0590-\u05FF]/.test(text) ? 'he' : 'en';
}

interface AssembledContext {
  contextBlock: string;
  matchedLocation: Location | null;
  threadHistory: string;
}

async function gatherContext(
  emailSubject: string,
  emailBody: string,
  senderEmail: string | undefined,
  threadId: string | undefined,
  currentMessageId: string | undefined,
  language: 'en' | 'he',
): Promise<AssembledContext> {
  const sections: string[] = [];

  // 1. Admin-editable playbook facts
  let playbookFacts: PlaybookFact[] = [];
  try { playbookFacts = await storage.getAllPlaybookFacts(); } catch {}
  if (playbookFacts.length) {
    sections.push(
      'GEMACH FACTS (admin-curated):\n' +
      playbookFacts.map(f => `- [${f.category}] ${f.factKey.replace(/_/g, ' ')}: ${f.factValue}`).join('\n')
    );
  }

  // 2. Sender's existing application, if any
  let matchedLocation: Location | null = null;
  try {
    if (senderEmail) {
      const apps = await storage.getAllApplications();
      const appMatch = apps.find((a: any) =>
        a?.email && String(a.email).toLowerCase() === senderEmail.toLowerCase()
      );
      if (appMatch) {
        sections.push(
          `SENDER HAS AN EXISTING APPLICATION:\n- Status: "${appMatch.status}"\n- Submitted address: "${appMatch.streetAddress || ''} ${appMatch.city || ''} ${appMatch.country || ''}".`
        );
      }
    }

    // 3. Match a location mentioned in the email
    const allLocations = await storage.getAllLocations();
    matchedLocation = findMatchingLocation(`${emailSubject} ${emailBody}`, allLocations);
    if (matchedLocation) {
      const depositAmount = (matchedLocation as any).depositAmount ?? 20;
      sections.push(
        `MATCHED LOCATION (the sender appears to be asking about this gemach — use these REAL facts, not generic ones).\n` +
        `IMPORTANT: do NOT include the operator's email, phone, or any internal location code in your reply — those are admin-only. The admin will forward to the operator if needed.\n` +
        `- Name: ${matchedLocation.name}\n` +
        `- Public address: ${matchedLocation.address || '(not provided)'}\n` +
        `- Refundable deposit at this location: $${depositAmount}`
      );
    }
  } catch {
    // best-effort context only
  }

  // 4. FAQ knowledge base — top relevant entries
  let threadHistory = '';
  try {
    const faqs = await storage.getActiveFaqEntries();
    const top = pickRelevantFaqs(`${emailSubject} ${emailBody}`, faqs, language, 4);
    if (top.length) {
      sections.push(
        'RELEVANT FAQ ANSWERS (use these as the source of truth for tone and content; rephrase, do not copy verbatim):\n' +
        top.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n---\n')
      );
    }
  } catch {}

  // 5. Thread history (prior messages in this Gmail thread)
  try {
    if (threadId) {
      const msgs = await getThreadMessages(threadId, 6);
      const prior = msgs.filter(m => m.id !== currentMessageId);
      if (prior.length) {
        threadHistory =
          'PRIOR MESSAGES IN THIS THREAD (oldest first — use this so you do not repeat info or contradict yourself):\n' +
          prior
            .map(m => `[${m.date}] From: ${m.from}\nSubject: ${m.subject}\n${m.body.slice(0, 1200)}`)
            .join('\n---\n');
        sections.push(threadHistory);
      }
    }
  } catch {}

  const contextBlock = sections.length
    ? sections.join('\n\n')
    : 'CONTEXT FROM OUR SYSTEM: (no specific context found for this inquiry)';
  return { contextBlock, matchedLocation, threadHistory };
}

export interface GeneratedEmailResponse {
  draft: string;
  classification: Classification;
  needsHumanReview: boolean;
  reviewReason?: string;
  matchedLocationId?: number;
  matchedLocationName?: string;
}

export async function generateEmailResponse(
  emailSubject: string,
  emailBody: string,
  senderName: string,
  senderEmail?: string,
  threadId?: string,
  currentMessageId?: string,
): Promise<GeneratedEmailResponse> {
  const language = detectLanguage(`${emailSubject} ${emailBody}`);
  const { contextBlock, matchedLocation } = await gatherContext(
    emailSubject, emailBody, senderEmail, threadId, currentMessageId, language
  );

  const systemPrompt = `You are a warm, knowledgeable representative of Baby Banz Gemach drafting an email reply on behalf of the gemach team.

${STATIC_PLAYBOOK}

WRITING STYLE
- Friendly, respectful, concise (4-10 sentences). No corporate jargon.
- Match the language the sender wrote in (English or Hebrew). If Hebrew, write in fluent, natural Hebrew.
- Use the right URL from KEY URLS above for the action you are recommending. Never invent URLs.
- When the context block lists MATCHED LOCATION facts (deposit amount, operator, etc.), USE THOSE REAL FACTS instead of any generic playbook value.
- When the context block lists PRIOR MESSAGES in the thread, do NOT repeat information already shared, and acknowledge what was previously discussed.
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

  const userPrompt = `${contextBlock}

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
    max_tokens: 1400,
    temperature: 0.5,
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
    matchedLocationId: matchedLocation?.id,
    matchedLocationName: matchedLocation?.name,
  };
}

export async function generateWelcomeOpener(input: {
  locationName: string;
  operatorName?: string;
  city?: string;
  country?: string;
}): Promise<string> {
  const safeName = (input.operatorName || '').trim();
  const place = [input.city, input.country].filter(Boolean).join(', ');
  const fallback = safeName
    ? `Hi ${safeName.split(/\s+/)[0]} — quick note to confirm the ${input.locationName} dashboard is set up and ready whenever you are.`
    : `Quick note to confirm the ${input.locationName} dashboard is set up and ready whenever you are.`;

  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const sys = `You write ONE warm, low-key opening sentence for a transactional "your dashboard is ready" email to a volunteer who runs a free-loan baby-earmuff gemach.
Rules:
- Exactly one sentence, max 25 words.
- Address the operator by first name only if a name is given; otherwise no name.
- Mention the gemach/location naturally; mention the city only if it adds warmth.
- Sound like a friendly confirmation, NOT a sales pitch or a broadcast. No "welcome!", no exclamation, no emojis, no marketing language.
- Plain text only. No quotes around the sentence.`;
    const user = `Location name: ${input.locationName}
Operator name: ${safeName || '(unknown)'}
City/area: ${place || '(unknown)'}`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      max_tokens: 80,
      temperature: 0.7,
    });
    const line = (resp.choices[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');
    if (!line || line.length > 240) return fallback;
    return line;
  } catch (err) {
    console.warn('generateWelcomeOpener failed, using fallback:', (err as any)?.message);
    return fallback;
  }
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
