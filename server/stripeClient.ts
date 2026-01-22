import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeSecretKeyFromEnv(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  return secretKey;
}

export function getStripePublishableKey(): string {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('STRIPE_PUBLISHABLE_KEY or VITE_STRIPE_PUBLISHABLE_KEY environment variable is required');
  }
  return publishableKey;
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = getStripeSecretKeyFromEnv();
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = getStripeSecretKeyFromEnv();
  return new Stripe(secretKey);
}

export async function getStripeSecretKey(): Promise<string> {
  return getStripeSecretKeyFromEnv();
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required for webhook verification');
  }
  return webhookSecret;
}

