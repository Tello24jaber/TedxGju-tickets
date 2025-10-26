-- TEDxGJU Ticket System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Purchase Requests Table
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_row_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  seat_tier TEXT,
  proof_url TEXT,
  payment_type TEXT,
  student_id TEXT,
  needs_transportation TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets Table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  seat_tier TEXT,
  student_id TEXT,
  needs_transportation TEXT,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('valid', 'redeemed', 'cancelled', 'expired')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT,
  purchase_request_id UUID REFERENCES purchase_requests(id)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System State Table (for tracking sync state)
CREATE TABLE system_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_email ON purchase_requests(email);
CREATE INDEX idx_purchase_requests_created_at ON purchase_requests(created_at DESC);

CREATE INDEX idx_tickets_token ON tickets(token);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_email ON tickets(purchaser_email);
CREATE INDEX idx_tickets_redeemed_at ON tickets(redeemed_at DESC);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- Row Level Security (RLS)
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service role bypasses these, staff can read all)
CREATE POLICY "Staff can view all purchase requests"
  ON purchase_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can update purchase requests"
  ON purchase_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view all tickets"
  ON tickets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can update tickets"
  ON tickets FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view system state"
  ON system_state FOR SELECT
  USING (auth.role() = 'authenticated');

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_state_updated_at
  BEFORE UPDATE ON system_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Initial system state
INSERT INTO system_state (key, value) VALUES
  ('last_synced_row', '{"row_index": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Sample data for testing (optional)
-- INSERT INTO purchase_requests (sheet_row_id, name, email, event_name, qty, status) VALUES
--   (1, 'John Doe', 'john@example.com', 'TEDxGJU 2025', 2, 'pending_review'),
--   (2, 'Jane Smith', 'jane@example.com', 'TEDxGJU 2025', 1, 'pending_review');
