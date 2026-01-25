import { getStripeClient, getStripeWebhookSecret } from './stripeClient.js';
import { storage } from './storage.js';
import { withRetry, logRetryFailure } from './helpers/retryHandler.js';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = getStripeClient();
    const webhookSecret = getStripeWebhookSecret();
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`Processing Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private static async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
    
    const result = await withRetry(
      async () => {
        const payments = await storage.getAllPayments();
        const payment = payments.find(p => p.externalPaymentId === paymentIntent.id);
        
        if (payment) {
          await storage.updatePaymentStatus(payment.id, 'completed', {
            notes: `Payment confirmed via webhook at ${new Date().toISOString()}`
          });
          console.log(`Updated payment ${payment.id} to completed`);
          return payment;
        } else {
          console.log(`No matching payment found for PaymentIntent: ${paymentIntent.id}`);
          return null;
        }
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Retry attempt ${attempt} for payment_intent.succeeded ${paymentIntent.id}:`, error.message);
        }
      }
    );

    if (!result.success) {
      await logRetryFailure(
        'handlePaymentIntentSucceeded',
        {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100
        },
        result.error!
      );
      throw new Error(`Failed to process payment_intent.succeeded after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }

  private static async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    console.log(`PaymentIntent failed: ${paymentIntent.id}`);
    
    const result = await withRetry(
      async () => {
        const payments = await storage.getAllPayments();
        const payment = payments.find(p => p.externalPaymentId === paymentIntent.id);
        
        if (payment) {
          const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
          await storage.updatePaymentStatus(payment.id, 'failed', {
            notes: `Payment failed: ${failureMessage}`
          });
          console.log(`Updated payment ${payment.id} to failed`);
          return payment;
        }
        return null;
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Retry attempt ${attempt} for payment_intent.payment_failed ${paymentIntent.id}:`, error.message);
        }
      }
    );

    if (!result.success) {
      await logRetryFailure(
        'handlePaymentIntentFailed',
        {
          paymentIntentId: paymentIntent.id,
          errorMessage: paymentIntent.last_payment_error?.message
        },
        result.error!
      );
      throw new Error(`Failed to process payment_intent.payment_failed after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }

  private static async handleChargeRefunded(charge: any): Promise<void> {
    console.log(`Charge refunded: ${charge.id}`);
    
    const result = await withRetry(
      async () => {
        const payments = await storage.getAllPayments();
        const payment = payments.find(p => 
          p.externalPaymentId === charge.payment_intent
        );
        
        if (payment) {
          const refundAmount = charge.amount_refunded / 100;
          await storage.updatePaymentStatus(payment.id, 'refunded', {
            notes: `Refunded $${refundAmount} via webhook at ${new Date().toISOString()}`
          });
          console.log(`Updated payment ${payment.id} to refunded`);
          return payment;
        } else {
          console.warn(`No matching payment found for charge: ${charge.payment_intent}`);
          return null;
        }
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Retry attempt ${attempt} for charge.refunded ${charge.id}:`, error.message);
        }
      }
    );

    if (!result.success) {
      // Log failure persistently for later retry
      await logRetryFailure(
        'handleChargeRefunded',
        {
          chargeId: charge.id,
          paymentIntentId: charge.payment_intent,
          refundAmount: charge.amount_refunded / 100
        },
        result.error!
      );
      throw new Error(`Failed to process charge.refunded after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }
}
