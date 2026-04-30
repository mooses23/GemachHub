# Baby Banz Earmuffs Gemach

## Overview

This full-stack web application facilitates the lending and management of Baby Banz noise-cancelling earmuffs through a global network of gemachs (lending libraries). Its core purpose is to protect infants' hearing by streamlining the lending process, managing refundable deposits, and providing administrative tools. The platform supports public users (borrowers, new gemach applicants), operators (manage specific gemach locations), and system administrators, aiming to expand worldwide access to infant ear protection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a dark glassmorphism theme with translucent panels and blur effects, a slate gradient background, Ocean Blue as the primary color, and Coral Orange for CTAs. It uses utility classes for glass effects and incorporates floating glow orbs. Typography is white for headings and slate-300/400 for body text.

### Technical Implementations
- **Frontend**: React with TypeScript, Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI) for components, and Tailwind CSS for styling. Vite is used for building.
- **Backend**: Node.js with Express, TypeScript (ESM), REST API (`/api/`), Passport.js for authentication (local, session-based), and PostgreSQL via `connect-pg-simple` for session storage. It has a modular structure for various services.
- **Data Layer**: Drizzle ORM with PostgreSQL (Neon serverless driver), sharing the schema between client/server. Key entities include Users, Locations, Transactions, Payments, and Applications.
- **Authentication & Authorization**: Implements role-based access control (user, operator, admin). Operators use PIN-based login for location-specific access. An invite code system is used for user registration.
- **Payment Processing**: A unified $20 refundable deposit system supports multiple methods (Stripe, PayPal, cash). Cash payments auto-complete at borrow time. A "Pay Later" system uses Stripe SetupIntents for card verification without immediate charge, minimizing fees. A role-based refund system allows full or partial refunds.
- **Internationalization (i18n)**: Supports English and Hebrew with 704 translation keys, a custom hook-based system, and automatic RTL support for Hebrew. Language preference is persisted in localStorage.
- **Operator Dashboard**: Includes inventory management (color-based tracking, low stock alerts), a guided "Lend Wizard", self-deposit acceptance, and a "Return Wizard" with damage deduction options. Operator PIN logic supports dynamic locations and first-time PIN setup.
- **Contact Actions**: A component for generating clickable phone, SMS, and WhatsApp links with pre-filled, localized messages, integrated into location cards and self-deposit forms.
- **Admin Inbox & AI Responses**: A unified inbox (`/admin/inbox`) merges Gmail and web-form contact messages. It integrates with OpenAI for drafting replies and classification, using a built-in playbook and database context. Admin replies are captured as `reply_examples` to improve future AI drafts.
- **Operator Onboarding**: Admins can send plaintext setup emails to operators with location codes and default PINs.
- **Message Send History**: All operator message send attempts (SMS, WhatsApp, email) are logged in `message_send_logs`, accessible via an admin GET endpoint and a UI card on `/admin/locations`.

## External Dependencies

-   **Payment Integrations**:
    -   Stripe: `@stripe/stripe-js`, `@stripe/react-stripe-js` (frontend); native Stripe SDK (backend).
    -   PayPal: `@paypal/paypal-server-sdk`.
-   **Database**:
    -   PostgreSQL: `pg` Pool driver.
    -   Drizzle ORM.
-   **Email**:
    -   Email notification service structure (`server/email-notifications.ts`) is ready for SMTP/email service integration.
-   **Admin Gmail Inbox & AI Responses**:
    -   Gmail API: `server/gmail-client.ts` for email reading and sending.
    -   OpenAI: `server/openai-client.ts` for AI-powered draft responses and classification.