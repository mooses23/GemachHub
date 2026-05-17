/**
 * One-shot script: syncs the dev schema snapshot to the production Neon DB.
 * Safe to re-run — every statement is guarded with IF NOT EXISTS or
 * ADD COLUMN IF NOT EXISTS so existing data is never disturbed.
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." node scripts/sync-prod-schema.mjs
 */

import pg from 'pg';
const { Client } = pg;

const url = process.env.PROD_DATABASE_URL;
if (!url) {
  console.error('Set PROD_DATABASE_URL before running this script.');
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();

async function run(sql, label) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (e) {
    // already-exists errors are benign
    if (e.code === '42701' || e.code === '42P07' || e.code === '42710' || e.code === '42P16' || e.code === '23505') {
      console.log(`  ~ ${label} (already exists — skipped)`);
    } else {
      console.error(`  ✗ ${label}: ${e.message}`);
      throw e;
    }
  }
}

console.log('\n── Sequences ─────────────────────────────────────────');
const seqs = [
  ['application_status_changes_id_seq', 'integer'],
  ['audit_logs_id_seq', 'integer'],
  ['city_categories_id_seq', 'integer'],
  ['contacts_id_seq', 'integer'],
  ['disputes_id_seq', 'integer'],
  ['faq_entries_id_seq', 'integer'],
  ['gemach_applications_id_seq', 'integer'],
  ['global_settings_id_seq', 'integer'],
  ['inventory_id_seq', 'integer'],
  ['invite_codes_id_seq', 'integer'],
  ['kb_embeddings_id_seq', 'integer'],
  ['knowledge_docs_id_seq', 'integer'],
  ['locations_id_seq', 'integer'],
  ['message_send_logs_id_seq', 'integer'],
  ['payments_id_seq', 'integer'],
  ['playbook_facts_id_seq', 'integer'],
  ['regions_id_seq', 'integer'],
  ['reply_examples_id_seq', 'integer'],
  ['return_reminder_events_id_seq', 'integer'],
  ['transactions_id_seq', 'integer'],
  ['users_id_seq', 'integer'],
  ['webhook_events_id_seq', 'integer'],
];
for (const [name] of seqs) {
  await run(
    `CREATE SEQUENCE IF NOT EXISTS public.${name} AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;`,
    `sequence ${name}`
  );
}

console.log('\n── Tables ────────────────────────────────────────────');

await run(`CREATE TABLE IF NOT EXISTS public.application_status_changes (
  id integer NOT NULL DEFAULT nextval('public.application_status_changes_id_seq'),
  application_id integer NOT NULL,
  previous_status text NOT NULL,
  new_status text NOT NULL,
  source text NOT NULL,
  changed_by_user_id integer,
  changed_by_username text,
  changed_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table application_status_changes');

await run(`CREATE TABLE IF NOT EXISTS public.audit_logs (
  id integer NOT NULL DEFAULT nextval('public.audit_logs_id_seq'),
  actor_user_id integer,
  actor_type text DEFAULT 'user' NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  before_json text,
  after_json text,
  metadata text,
  ip_address text,
  created_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table audit_logs');

await run(`CREATE TABLE IF NOT EXISTS public.city_categories (
  id integer NOT NULL DEFAULT nextval('public.city_categories_id_seq'),
  name text NOT NULL,
  slug text NOT NULL,
  region_id integer NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  is_popular boolean DEFAULT false,
  description text,
  state_code text,
  name_he text,
  description_he text
);`, 'table city_categories');

await run(`CREATE TABLE IF NOT EXISTS public.contacts (
  id integer NOT NULL DEFAULT nextval('public.contacts_id_seq'),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  submitted_at timestamp without time zone DEFAULT now() NOT NULL,
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false NOT NULL,
  is_spam boolean DEFAULT false NOT NULL
);`, 'table contacts');

await run(`CREATE TABLE IF NOT EXISTS public.disputes (
  id integer NOT NULL DEFAULT nextval('public.disputes_id_seq'),
  location_id integer,
  transaction_id integer,
  stripe_dispute_id text NOT NULL,
  stripe_charge_id text NOT NULL,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  evidence_due_by timestamp without time zone,
  raw_payload_json text,
  created_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table disputes');

await run(`CREATE TABLE IF NOT EXISTS public.faq_entries (
  id integer NOT NULL DEFAULT nextval('public.faq_entries_id_seq'),
  question text NOT NULL,
  answer text NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  category text DEFAULT 'general' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  updated_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table faq_entries');

await run(`CREATE TABLE IF NOT EXISTS public.gemach_applications (
  id integer NOT NULL DEFAULT nextval('public.gemach_applications_id_seq'),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  country text NOT NULL,
  community text,
  message text,
  status text DEFAULT 'pending' NOT NULL,
  submitted_at timestamp without time zone DEFAULT now() NOT NULL,
  confirmation_email_sent_at timestamp without time zone
);`, 'table gemach_applications');

await run(`CREATE TABLE IF NOT EXISTS public.global_settings (
  id integer NOT NULL DEFAULT nextval('public.global_settings_id_seq'),
  key text NOT NULL,
  value text,
  is_enabled boolean DEFAULT true,
  updated_at timestamp without time zone DEFAULT now()
);`, 'table global_settings');

await run(`CREATE TABLE IF NOT EXISTS public.inventory (
  id integer NOT NULL DEFAULT nextval('public.inventory_id_seq'),
  location_id integer NOT NULL,
  color text NOT NULL,
  quantity integer DEFAULT 0 NOT NULL
);`, 'table inventory');

await run(`CREATE TABLE IF NOT EXISTS public.invite_codes (
  id integer NOT NULL DEFAULT nextval('public.invite_codes_id_seq'),
  code text NOT NULL,
  location_id integer NOT NULL,
  application_id integer,
  is_used boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now() NOT NULL,
  used_at timestamp without time zone,
  used_by_user_id integer
);`, 'table invite_codes');

await run(`CREATE TABLE IF NOT EXISTS public.kb_embeddings (
  id integer NOT NULL DEFAULT nextval('public.kb_embeddings_id_seq'),
  source_kind text NOT NULL,
  source_id integer NOT NULL,
  chunk_idx integer DEFAULT 0 NOT NULL,
  content text NOT NULL,
  embedding jsonb NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  updated_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table kb_embeddings');

await run(`CREATE TABLE IF NOT EXISTS public.knowledge_docs (
  id integer NOT NULL DEFAULT nextval('public.knowledge_docs_id_seq'),
  title text NOT NULL,
  body text NOT NULL,
  category text DEFAULT 'general' NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  updated_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table knowledge_docs');

await run(`CREATE TABLE IF NOT EXISTS public.locations (
  id integer NOT NULL DEFAULT nextval('public.locations_id_seq'),
  name text NOT NULL,
  location_code text NOT NULL,
  contact_person text NOT NULL,
  address text NOT NULL,
  zip_code text,
  phone text NOT NULL,
  email text NOT NULL,
  region_id integer NOT NULL,
  city_category_id integer,
  is_active boolean DEFAULT true,
  cash_only boolean DEFAULT false,
  deposit_amount integer DEFAULT 20,
  payment_methods text[] DEFAULT '{cash}',
  processing_fee_percent integer DEFAULT 300,
  operator_pin text,
  name_he text,
  contact_person_he text,
  address_he text,
  claim_token text,
  claim_token_created_at timestamp without time zone,
  welcome_sent_at timestamp without time zone,
  welcome_sms_status text,
  welcome_sms_error text,
  welcome_sms_sent_at timestamp without time zone,
  welcome_whatsapp_status text,
  welcome_whatsapp_error text,
  welcome_whatsapp_sent_at timestamp without time zone,
  default_welcome_channel text,
  contact_preference text,
  contact_preference_set_at timestamp without time zone,
  onboarded_at timestamp without time zone,
  welcome_sms_sid text,
  welcome_sms_delivered_at timestamp without time zone,
  welcome_whatsapp_sid text,
  welcome_whatsapp_delivered_at timestamp without time zone,
  processing_fee_fixed integer DEFAULT 30,
  welcome_email_status text,
  welcome_email_error text,
  welcome_email_sent_at timestamp without time zone,
  latitude double precision,
  longitude double precision,
  geocoded_at timestamp without time zone
);`, 'table locations');

await run(`CREATE TABLE IF NOT EXISTS public.message_send_logs (
  id integer NOT NULL DEFAULT nextval('public.message_send_logs_id_seq'),
  location_id integer,
  location_name text NOT NULL,
  location_code text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  error text,
  sent_at timestamp without time zone DEFAULT now() NOT NULL,
  sent_by_user_id integer,
  batch_id text
);`, 'table message_send_logs');

await run(`CREATE TABLE IF NOT EXISTS public.payments (
  id integer NOT NULL DEFAULT nextval('public.payments_id_seq'),
  transaction_id integer NOT NULL,
  payment_method text NOT NULL,
  payment_provider text,
  external_payment_id text,
  deposit_amount integer NOT NULL,
  processing_fee integer DEFAULT 0,
  total_amount integer NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  payment_data text,
  created_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  retry_attempts integer DEFAULT 0
);`, 'table payments');

await run(`CREATE TABLE IF NOT EXISTS public.playbook_facts (
  id integer NOT NULL DEFAULT nextval('public.playbook_facts_id_seq'),
  fact_key text NOT NULL,
  fact_value text NOT NULL,
  category text DEFAULT 'general' NOT NULL,
  updated_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table playbook_facts');

await run(`CREATE TABLE IF NOT EXISTS public.regions (
  id integer NOT NULL DEFAULT nextval('public.regions_id_seq'),
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  name_he text
);`, 'table regions');

await run(`CREATE TABLE IF NOT EXISTS public.reply_examples (
  id integer NOT NULL DEFAULT nextval('public.reply_examples_id_seq'),
  source_type text NOT NULL,
  source_ref text,
  sender_email text,
  sender_name text,
  incoming_subject text NOT NULL,
  incoming_body text NOT NULL,
  sent_reply text NOT NULL,
  classification text,
  language text DEFAULT 'en' NOT NULL,
  matched_location_id integer,
  was_edited boolean DEFAULT false NOT NULL,
  created_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table reply_examples');

await run(`CREATE TABLE IF NOT EXISTS public.return_reminder_events (
  id integer NOT NULL DEFAULT nextval('public.return_reminder_events_id_seq'),
  transaction_id integer NOT NULL,
  sent_at timestamp without time zone DEFAULT now() NOT NULL,
  sent_by_user_id integer,
  channel text DEFAULT 'email' NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  twilio_sid text,
  delivery_status text,
  delivery_status_updated_at timestamp without time zone,
  delivery_error_code text
);`, 'table return_reminder_events');

await run(`CREATE TABLE IF NOT EXISTS public.transactions (
  id integer NOT NULL DEFAULT nextval('public.transactions_id_seq'),
  location_id integer NOT NULL,
  borrower_name text NOT NULL,
  borrower_email text,
  borrower_phone text,
  headband_color text,
  deposit_amount double precision DEFAULT 20 NOT NULL,
  deposit_payment_method text DEFAULT 'cash',
  refund_amount double precision,
  is_returned boolean DEFAULT false,
  borrow_date timestamp without time zone DEFAULT now() NOT NULL,
  expected_return_date timestamp without time zone,
  actual_return_date timestamp without time zone,
  notes text,
  pay_later_status text,
  stripe_customer_id text,
  stripe_setup_intent_id text,
  stripe_payment_method_id text,
  stripe_payment_intent_id text,
  amount_planned_cents integer,
  currency text DEFAULT 'usd',
  magic_token text,
  magic_token_expires_at timestamp without time zone,
  charge_error_code text,
  charge_error_message text,
  last_return_reminder_at timestamp without time zone,
  return_reminder_count integer DEFAULT 0 NOT NULL,
  consent_text text,
  consent_accepted_at timestamp without time zone,
  consent_max_charge_cents integer,
  card_saved_at timestamp without time zone,
  charge_notification_sent_at timestamp without time zone,
  charge_notification_channel text,
  deposit_fee_cents integer,
  charged_at timestamp without time zone,
  stripe_refund_id text,
  refund_attempted_at timestamp without time zone
);`, 'table transactions');

await run(`CREATE TABLE IF NOT EXISTS public.user_sessions (
  sid text NOT NULL,
  sess jsonb NOT NULL,
  expire timestamp with time zone NOT NULL
);`, 'table user_sessions');

await run(`CREATE TABLE IF NOT EXISTS public.users (
  id integer NOT NULL DEFAULT nextval('public.users_id_seq'),
  username text NOT NULL,
  password text NOT NULL,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text DEFAULT 'operator' NOT NULL,
  is_admin boolean DEFAULT false,
  location_id integer
);`, 'table users');

await run(`CREATE TABLE IF NOT EXISTS public.webhook_events (
  id integer NOT NULL DEFAULT nextval('public.webhook_events_id_seq'),
  event_id text NOT NULL,
  event_type text NOT NULL,
  processed_at timestamp without time zone DEFAULT now() NOT NULL
);`, 'table webhook_events');

// ── Missing columns (ADD COLUMN IF NOT EXISTS) ──────────────────────────────
console.log('\n── Missing-column patches ────────────────────────────');

const colPatches = [
  // contacts
  ['contacts', 'is_archived', 'boolean DEFAULT false NOT NULL'],
  ['contacts', 'is_spam',    'boolean DEFAULT false NOT NULL'],
  // locations — newer columns that older prod DBs may be missing
  ['locations', 'processing_fee_fixed',        'integer DEFAULT 30'],
  ['locations', 'welcome_email_status',         'text'],
  ['locations', 'welcome_email_error',          'text'],
  ['locations', 'welcome_email_sent_at',        'timestamp without time zone'],
  ['locations', 'latitude',                     'double precision'],
  ['locations', 'longitude',                    'double precision'],
  ['locations', 'geocoded_at',                  'timestamp without time zone'],
  // transactions — newer columns
  ['transactions', 'return_reminder_count',         'integer DEFAULT 0 NOT NULL'],
  ['transactions', 'consent_text',                  'text'],
  ['transactions', 'consent_accepted_at',           'timestamp without time zone'],
  ['transactions', 'consent_max_charge_cents',      'integer'],
  ['transactions', 'card_saved_at',                 'timestamp without time zone'],
  ['transactions', 'charge_notification_sent_at',   'timestamp without time zone'],
  ['transactions', 'charge_notification_channel',   'text'],
  ['transactions', 'deposit_fee_cents',             'integer'],
  ['transactions', 'charged_at',                    'timestamp without time zone'],
  ['transactions', 'stripe_refund_id',              'text'],
  ['transactions', 'refund_attempted_at',           'timestamp without time zone'],
  // return_reminder_events — newer columns
  ['return_reminder_events', 'twilio_sid',                     'text'],
  ['return_reminder_events', 'delivery_status',                'text'],
  ['return_reminder_events', 'delivery_status_updated_at',     'timestamp without time zone'],
  ['return_reminder_events', 'delivery_error_code',            'text'],
];

for (const [table, col, def] of colPatches) {
  await run(
    `ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${col} ${def};`,
    `${table}.${col}`
  );
}

// ── Primary-key constraints ──────────────────────────────────────────────────
console.log('\n── Primary keys ──────────────────────────────────────');
const pks = [
  ['application_status_changes', 'application_status_changes_pkey', 'id'],
  ['audit_logs',                 'audit_logs_pkey',                  'id'],
  ['city_categories',            'city_categories_pkey',             'id'],
  ['contacts',                   'contacts_pkey',                    'id'],
  ['disputes',                   'disputes_pkey',                    'id'],
  ['faq_entries',                'faq_entries_pkey',                 'id'],
  ['gemach_applications',        'gemach_applications_pkey',         'id'],
  ['global_settings',            'global_settings_pkey',             'id'],
  ['inventory',                  'inventory_pkey',                   'id'],
  ['invite_codes',               'invite_codes_pkey',                'id'],
  ['kb_embeddings',              'kb_embeddings_pkey',               'id'],
  ['knowledge_docs',             'knowledge_docs_pkey',              'id'],
  ['locations',                  'locations_pkey',                   'id'],
  ['message_send_logs',          'message_send_logs_pkey',           'id'],
  ['payments',                   'payments_pkey',                    'id'],
  ['playbook_facts',             'playbook_facts_pkey',              'id'],
  ['regions',                    'regions_pkey',                     'id'],
  ['reply_examples',             'reply_examples_pkey',              'id'],
  ['return_reminder_events',     'return_reminder_events_pkey',      'id'],
  ['transactions',               'transactions_pkey',                'id'],
  ['user_sessions',              'user_sessions_pkey',               'sid'],
  ['users',                      'users_pkey',                       'id'],
  ['webhook_events',             'webhook_events_pkey',              'id'],
];
for (const [table, constraint, col] of pks) {
  await run(
    `ALTER TABLE public.${table} ADD CONSTRAINT ${constraint} PRIMARY KEY (${col});`,
    `pk ${table}`
  );
}

// ── Unique constraints ───────────────────────────────────────────────────────
console.log('\n── Unique constraints ────────────────────────────────');
await run(`ALTER TABLE public.users       ADD CONSTRAINT users_username_unique UNIQUE (username);`, 'users.username unique');
await run(`ALTER TABLE public.users       ADD CONSTRAINT users_email_unique    UNIQUE (email);`,    'users.email unique');
await run(`ALTER TABLE public.locations   ADD CONSTRAINT locations_location_code_unique UNIQUE (location_code);`, 'locations.location_code unique');
await run(`ALTER TABLE public.regions     ADD CONSTRAINT regions_slug_unique   UNIQUE (slug);`,     'regions.slug unique');
await run(`ALTER TABLE public.global_settings ADD CONSTRAINT global_settings_key_unique UNIQUE (key);`, 'global_settings.key unique');
await run(`ALTER TABLE public.webhook_events  ADD CONSTRAINT webhook_events_event_id_unique UNIQUE (event_id);`, 'webhook_events.event_id unique');
await run(`ALTER TABLE public.playbook_facts  ADD CONSTRAINT playbook_facts_fact_key_unique UNIQUE (fact_key);`, 'playbook_facts.fact_key unique');

// ── Indexes ──────────────────────────────────────────────────────────────────
console.log('\n── Indexes ───────────────────────────────────────────');
await run(`CREATE INDEX IF NOT EXISTS idx_transactions_location   ON public.transactions (location_id);`, 'idx transactions.location_id');
await run(`CREATE INDEX IF NOT EXISTS idx_transactions_magic      ON public.transactions (magic_token);`, 'idx transactions.magic_token');
await run(`CREATE INDEX IF NOT EXISTS idx_payments_transaction    ON public.payments (transaction_id);`, 'idx payments.transaction_id');
await run(`CREATE INDEX IF NOT EXISTS idx_inventory_location      ON public.inventory (location_id);`, 'idx inventory.location_id');
await run(`CREATE INDEX IF NOT EXISTS idx_invite_codes_location   ON public.invite_codes (location_id);`, 'idx invite_codes.location_id');
await run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity       ON public.audit_logs (entity_type, entity_id);`, 'idx audit_logs.entity');
await run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expire    ON public.user_sessions (expire);`, 'idx user_sessions.expire');
await run(`CREATE INDEX IF NOT EXISTS idx_kb_embeddings_source    ON public.kb_embeddings (source_kind, source_id);`, 'idx kb_embeddings.source');
await run(`CREATE INDEX IF NOT EXISTS idx_disputes_stripe         ON public.disputes (stripe_dispute_id);`, 'idx disputes.stripe_dispute_id');
await run(`CREATE INDEX IF NOT EXISTS idx_locations_region        ON public.locations (region_id);`, 'idx locations.region_id');
await run(`CREATE INDEX IF NOT EXISTS idx_city_categories_region  ON public.city_categories (region_id);`, 'idx city_categories.region_id');

await client.end();
console.log('\n✅  Production schema sync complete.\n');
