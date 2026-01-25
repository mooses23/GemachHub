import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmailResponse(
  emailSubject: string,
  emailBody: string,
  senderName: string
): Promise<string> {
  const systemPrompt = `You are a helpful customer service representative for GemachHub, a platform that manages headband lending locations (gemachs). 
Your job is to write professional, friendly, and helpful email responses. 
Keep responses concise but thorough. Always be polite and use appropriate greetings and sign-offs.
The business deals with headband rentals, deposits, returns, and location management.`;

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
