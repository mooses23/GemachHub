import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmailResponse(
  emailSubject: string,
  emailBody: string,
  senderName: string
): Promise<string> {
  const systemPrompt = `You are a helpful, warm representative of Baby Banz Gemach, a global Jewish community network that lends baby noise-cancelling earmuffs at simchas and events.
Write professional, friendly, and concise email responses. Use appropriate greetings and sign-offs.
The gemach handles loans, $20 refundable deposits, returns, and questions about opening new locations.
Sign off as "Baby Banz Gemach".`;

  const userPrompt = `Please draft a professional response to this email:

From: ${senderName}
Subject: ${emailSubject}

${emailBody}

Write a helpful and professional response.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || 'Unable to generate response.';
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
      { role: 'user', content: text }
    ],
    max_tokens: 1500,
    temperature: 0.2
  });

  return response.choices[0]?.message?.content?.trim() || text;
}
