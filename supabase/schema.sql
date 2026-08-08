-- ============================================================================
-- HUB CLT — SUPABASE DATABASE SCHEMA & SECURITY POLICIES
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. CALCULATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS calculation_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary_text TEXT,
  valor_liquido_principal NUMERIC(12,2) DEFAULT 0,
  details_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Index for history lookups by user_id
CREATE INDEX IF NOT EXISTS idx_calculation_history_user_id ON calculation_history (user_id);

-- 3. AUTOMATIC UPDATED_AT TRIGGER FOR USERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- ARCHITECTURAL DECISION & DEFENSE-IN-DEPTH:
-- The Express backend communicates with Supabase using SUPABASE_SERVICE_ROLE_KEY,
-- which intentionally bypasses Row Level Security (RLS) for server-side authority.
-- 
-- Enabling RLS with NO permissive policies for 'anon' or 'authenticated' roles
-- ensures a Strict "Deny All by Default" posture.
-- If VITE_SUPABASE_ANON_KEY is ever exposed or used directly from client-side browsers,
-- direct REST API calls to /rest/v1/users or /rest/v1/calculation_history will be
-- blocked by default.
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;

-- Explicit restrictive policies (deny all direct client access)
DROP POLICY IF EXISTS "Deny public direct access to users" ON users;
CREATE POLICY "Deny public direct access to users"
  ON users
  FOR ALL
  TO public
  USING (false);

DROP POLICY IF EXISTS "Deny public direct access to calculation_history" ON calculation_history;
CREATE POLICY "Deny public direct access to calculation_history"
  ON calculation_history
  FOR ALL
  TO public
  USING (false);
