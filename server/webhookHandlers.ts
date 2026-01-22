import { getStripeClient, getStripeWebhookSecret } from './stripeClient.js';
import { storage } from './storage.js';

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
    
    try {
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.externalPaymentId === paymentIntent.id);
      
      if (payment) {
        await storage.updatePaymentStatus(payment.id, 'completed', {
          notes: `Payment confirmed via webhook at ${new Date().toISOString()}`
        });
        console.log(`Updated payment ${payment.id} to completed`);
      } else {
        console.log(`No matching payment found for PaymentIntent: ${paymentIntent.id}`);
      }
    } catch (error) {
      console.error('Error handling payment_intent.succeeded:', error);
      throw error;
    }
  }

  private static async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    console.log(`PaymentIntent failed: ${paymentIntent.id}`);
    
    try {
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.externalPaymentId === paymentIntent.id);
      
      if (payment) {
        const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
        await storage.updatePaymentStatus(payment.id, 'failed', {
          notes: `Payment failed: ${failureMessage}`
        });
        console.log(`Updated payment ${payment.id} to failed`);
      }
    } catch (error) {
      console.error('Error handling payment_intent.payment_failed:', error);
      throw error;
    }
  }

  private static async handleChargeRefunded(charge: any): Promise<void> {
    console.log(`Charge refunded: ${charge.id}`);
    
    try {
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
      }
    } catch (error) {
      console.error('Error handling charge.refunded:', error);
      throw error;
    }
  }
}
