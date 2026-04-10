-- ============================================================
-- EDGE Ticket Hub — Supabase Schema
-- Run this entire file in your Supabase project's SQL editor
-- ============================================================

-- Ticket ID sequence (starts at 7 — after the 6 seed tickets)
CREATE SEQUENCE IF NOT EXISTS ticket_seq START WITH 7;

-- ─── tickets ─────────────────────────────────────────────────────────────────
CREATE TABLE tickets (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'content')),
  page         TEXT NOT NULL,
  section      TEXT,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'suggestion')),
  browser      TEXT,
  submitter    TEXT NOT NULL,
  email        TEXT NOT NULL,
  affiliation  TEXT,
  department   TEXT,
  organization TEXT,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'rejected')),
  votes        INTEGER NOT NULL DEFAULT 1,
  voters       JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution   TEXT,
  created      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status  ON tickets(status);
CREATE INDEX idx_tickets_type    ON tickets(type);
CREATE INDEX idx_tickets_created ON tickets(created DESC);

-- ─── votes (deduplication) ───────────────────────────────────────────────────
CREATE TABLE votes (
  id          SERIAL PRIMARY KEY,
  ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  voter_hash  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, voter_hash)
);

CREATE INDEX idx_votes_ticket ON votes(ticket_id);

-- ─── emails (outbox queue) ───────────────────────────────────────────────────
CREATE TABLE emails (
  id         TEXT PRIMARY KEY,
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  to_email   TEXT NOT NULL,
  to_name    TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at    TIMESTAMPTZ
);

CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_ticket ON emails(ticket_id);

-- ─── admin_config ────────────────────────────────────────────────────────────
-- Stores scrypt-hashed passphrase after first password change.
-- Initial login uses the ADMIN_PASSPHRASE environment variable.
CREATE TABLE admin_config (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  passphrase_hash TEXT NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admin_config (passphrase_hash) VALUES ('');

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- All access goes through Netlify Functions using the service_role key,
-- which bypasses RLS. The anon key is never used or exposed.
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- ─── Seed Data (6 demo tickets) ──────────────────────────────────────────────
INSERT INTO tickets (id, type, page, section, title, description, severity, browser, submitter, email, affiliation, department, status, votes, voters, notes, resolution, created, updated) VALUES
(
  'EDGE-001', 'bug', 'sites', 'fee-estimator',
  'Fee Estimator: $0 SDC for Industrial over 50k sqft',
  'Industrial SDC calculates to $0 when sqft > 50,000. Commercial/residential work. Steps: Site Selector > Fee Estimator > Industrial > 55,000 sqft.',
  'high', 'chrome', 'Mark Chen', 'mchen@cityofmedford.org', 'city-staff', 'dev-services',
  'open', 3,
  '[{"name":"Mark Chen","email":"mchen@cityofmedford.org","date":"2026-04-07T09:00:00Z"},{"name":"Sarah Lopez","email":"slopez@cityofmedford.org","date":"2026-04-07T14:00:00Z"},{"name":"Tom Baker","email":"tbaker@cityofmedford.org","date":"2026-04-08T08:00:00Z"}]',
  '[]', null, '2026-04-07T09:15:00Z', '2026-04-07T14:00:00Z'
),
(
  'EDGE-002', 'content', 'why', 'target-sectors',
  'Healthcare sector: update employer count',
  'Card says "4,200+" but OR Employment Dept shows 5,100+. Asante should be ~6,800 per 2025 report.',
  'medium', null, 'Lisa Park', 'lpark@cityofmedford.org', 'city-staff', 'city-manager',
  'open', 2,
  '[{"name":"Lisa Park","email":"lpark@cityofmedford.org","date":"2026-04-06T10:00:00Z"},{"name":"Warren Ng","email":"econdev@cityofmedford.org","date":"2026-04-06T15:00:00Z"}]',
  '[]', null, '2026-04-06T10:30:00Z', '2026-04-06T15:00:00Z'
),
(
  'EDGE-003', 'feature', 'contact', 'contact-journey',
  'Add "Permitting" to contact journey',
  'No permitting path. Add "Permitting & Plan Review" routing to Dev Services with context.',
  'medium', null, 'James Wright', 'jwright@cityofmedford.org', 'city-staff', 'dev-services',
  'open', 4,
  '[{"name":"James Wright","email":"jwright@cityofmedford.org","date":"2026-04-05T11:00:00Z"},{"name":"Mark Chen","email":"mchen@cityofmedford.org","date":"2026-04-05T14:00:00Z"},{"name":"Lisa Park","email":"lpark@cityofmedford.org","date":"2026-04-06T09:00:00Z"},{"name":"Karen Miller","email":"kmiller@cityofmedford.org","date":"2026-04-07T10:00:00Z"}]',
  '[]', null, '2026-04-05T11:20:00Z', '2026-04-07T10:00:00Z'
),
(
  'EDGE-004', 'bug', 'meda', 'meda-responses',
  'MEDA recommends closed SBDC',
  'MEDA suggests SOU SBDC (closed Dec 2025). Should recommend SCORE or Rogue Workforce.',
  'critical', null, 'Warren Ng', 'econdev@cityofmedford.org', 'city-staff', 'econ-dev',
  'in-progress', 5,
  '[{"name":"Warren Ng","email":"econdev@cityofmedford.org","date":"2026-04-04T08:00:00Z"},{"name":"John Vial","email":"jvial@cityofmedford.org","date":"2026-04-04T09:00:00Z"},{"name":"Lisa Park","email":"lpark@cityofmedford.org","date":"2026-04-04T11:00:00Z"},{"name":"James Wright","email":"jwright@cityofmedford.org","date":"2026-04-05T08:00:00Z"},{"name":"Karen Miller","email":"kmiller@cityofmedford.org","date":"2026-04-06T09:00:00Z"}]',
  '[{"status":"in-progress","text":"Updating MEDA prompt.","date":"2026-04-05T10:00:00Z"}]',
  null, '2026-04-04T08:45:00Z', '2026-04-06T09:00:00Z'
),
(
  'EDGE-005', 'bug', 'why', 'ei-dashboard',
  'EI charts blank on mobile Safari',
  'iPhone Safari: all 6 EI tabs show blank charts. Works on Chrome mobile.',
  'high', 'mobile-ios', 'Tom Baker', 'tbaker@cityofmedford.org', 'city-staff', 'it',
  'open', 2,
  '[{"name":"Tom Baker","email":"tbaker@cityofmedford.org","date":"2026-04-07T13:00:00Z"},{"name":"Sarah Lopez","email":"slopez@cityofmedford.org","date":"2026-04-08T09:00:00Z"}]',
  '[]', null, '2026-04-07T13:15:00Z', '2026-04-08T09:00:00Z'
),
(
  'EDGE-006', 'feature', 'global', 'accessibility',
  'WCAG: skip-nav + ARIA landmarks',
  'Need skip-to-main link, ARIA landmarks, focus-visible outlines before public launch.',
  'high', null, 'Karen Miller', 'kmiller@cityofmedford.org', 'city-staff', 'comms',
  'open', 3,
  '[{"name":"Karen Miller","email":"kmiller@cityofmedford.org","date":"2026-04-06T14:00:00Z"},{"name":"Tom Baker","email":"tbaker@cityofmedford.org","date":"2026-04-07T08:00:00Z"},{"name":"Warren Ng","email":"econdev@cityofmedford.org","date":"2026-04-07T16:00:00Z"}]',
  '[]', null, '2026-04-06T14:30:00Z', '2026-04-07T16:00:00Z'
);
