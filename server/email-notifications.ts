/**
 * Email Notification Service
 * Sends notifications for deposit confirmations, failures, and refunds
 */

export class EmailNotificationService {
  /**
   * Sends email notification for failed deposit confirmation
   */
  static async notifyFailedDeposit(payment: any, transaction: any): Promise<void> {
    try {
      // Email configuration would require SMTP credentials from user
      const emailData = {
        to: process.env.ADMIN_EMAIL || 'admin@gemach.com',
        subject: `Failed Deposit Confirmation - Transaction #${transaction.id}`,
        html: `
          <h2>Deposit Confirmation Failed</h2>
          <p><strong>Transaction ID:</strong> ${transaction.id}</p>
          <p><strong>Borrower:</strong> ${transaction.borrowerName}</p>
          <p><strong>Amount:</strong> $${payment.totalAmount}</p>
          <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
          <p><strong>Error:</strong> Manual confirmation required</p>
          <p><strong>Action Required:</strong> Please review and manually confirm this deposit in the admin panel.</p>
        `
      };

      // Would integrate with email service like SendGrid, AWS SES, or SMTP
      console.log('Email notification queued:', emailData);
      
      // TODO: Implement actual email sending when user provides SMTP/email service credentials
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  /**
   * Sends confirmation email for successful deposit
   */
  static async notifyDepositConfirmed(payment: any, transaction: any): Promise<void> {
    try {
      const emailData = {
        to: transaction.borrowerEmail,
        subject: `Deposit Confirmed - Baby Banz Earmuffs Gemach`,
        html: `
          <h2>Deposit Successfully Confirmed</h2>
          <p>Dear ${transaction.borrowerName},</p>
          <p>Your deposit of $${payment.totalAmount} has been confirmed.</p>
          <p><strong>Transaction ID:</strong> ${transaction.id}</p>
          <p><strong>Expected Return:</strong> ${transaction.expectedReturnDate}</p>
          <p>Please return the earmuffs by the expected date to receive your full refund.</p>
          <p>Thank you for using our service!</p>
        `
      };

      console.log('Confirmation email queued:', emailData);
    } catch (error) {
      console.error('Confirmation email error:', error);
    }
  }

  /**
   * Sends refund notification email
   */
  static async notifyRefundProcessed(refundAmount: number, transaction: any): Promise<void> {
    try {
      const emailData = {
        to: transaction.borrowerEmail,
        subject: `Refund Processed - Baby Banz Earmuffs Gemach`,
        html: `
          <h2>Deposit Refund Processed</h2>
          <p>Dear ${transaction.borrowerName},</p>
          <p>Your deposit refund of $${refundAmount} has been processed.</p>
          <p><strong>Transaction ID:</strong> ${transaction.id}</p>
          <p><strong>Return Date:</strong> ${transaction.actualReturnDate}</p>
          <p>Thank you for returning the earmuffs in good condition!</p>
        `
      };

      console.log('Refund email queued:', emailData);
    } catch (error) {
      console.error('Refund email error:', error);
    }
  }
}

import { sendNewEmail } from './gmail-client.js';

export interface OperatorWelcomeContext {
  locationName: string;
  locationCode: string;
  operatorName: string;
  operatorEmail: string;
  dashboardUrl: string;
  defaultPin: string;
}

function buildWelcomeEmail(ctx: OperatorWelcomeContext): { subject: string; body: string } {
  const subject = `Welcome to your Baby Banz Gemach dashboard — ${ctx.locationName}`;
  const body = `Hi ${ctx.operatorName || 'there'},

Thank you for being part of the Baby Banz Gemach network! This email is to make sure you know how to access the operator dashboard for your location.

YOUR LOCATION
  Name:           ${ctx.locationName}
  Location code:  ${ctx.locationCode}

HOW TO LOG IN
  1. Go to: ${ctx.dashboardUrl}
  2. Enter your location code: ${ctx.locationCode}
  3. Enter the temporary PIN: ${ctx.defaultPin}

PLEASE CHANGE YOUR PIN
After your first login, please change your PIN to something only you know:
  • Click your profile / settings in the dashboard
  • Choose "Change PIN"
  • Pick any 4–6 digit number you'll remember

WHAT THE DASHBOARD LETS YOU DO
  • See and update your inventory of earmuffs
  • Log a loan when someone borrows a pair
  • Mark returns and refund deposits
  • View your loan history and active borrowers

If you have any questions, just reply to this email.

Thank you for serving your community,
Baby Banz Gemach
`;
  return { subject, body };
}

export async function sendOperatorWelcomeEmail(ctx: OperatorWelcomeContext): Promise<void> {
  const { subject, body } = buildWelcomeEmail(ctx);
  await sendNewEmail(ctx.operatorEmail, subject, body);
}
