-- ============================================================================
-- PHARMA LOOM SEGREGATED AGENT MODEL - DATABASE SCHEMA
-- Version: 2.0 (Bankruptcy Remote)
-- Created: 2025-12-29
-- ============================================================================

-- ============================================================================
-- 1. SEGREGATED_WALLETS TABLE
-- Each client gets their own XRPL wallet (bankruptcy remote)
-- ============================================================================

CREATE TABLE IF NOT EXISTS segregated_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Master Key (CLIENT owns, ultimate authority)
    master_address VARCHAR(34) NOT NULL UNIQUE,
    master_public_key VARCHAR(66) NOT NULL,
    encrypted_master_seed TEXT NOT NULL, -- AES-256 encrypted, client can export
    
    -- Regular Key (PHARMA LOOM controls, delegated signing)
    regular_key_address VARCHAR(34) NOT NULL, -- Pharma Loom's RegularKey wallet
    regular_key_enabled BOOLEAN DEFAULT false,
    regular_key_enabled_at TIMESTAMP WITH TIME ZONE,
    regular_key_tx_hash VARCHAR(64), -- SetRegularKey transaction
    
    -- Metadata
    network VARCHAR(10) NOT NULL CHECK (network IN ('testnet', 'mainnet')),
    wallet_type VARCHAR(20) DEFAULT 'client' CHECK (wallet_type IN ('client', 'vendor')),
    is_active BOOLEAN DEFAULT true,
    last_balance_check TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_client_project_segregated UNIQUE (client_id, project_id, network)
);

-- Row-Level Security
ALTER TABLE segregated_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own segregated wallets"
    ON segregated_wallets FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Service can manage segregated wallets"
    ON segregated_wallets FOR ALL
    WITH CHECK (true); -- Restrict to service role

-- Indexes
CREATE INDEX idx_segregated_wallets_client_id ON segregated_wallets(client_id);
CREATE INDEX idx_segregated_wallets_master_address ON segregated_wallets(master_address);
CREATE INDEX idx_segregated_wallets_regular_key_enabled ON segregated_wallets(regular_key_enabled);

-- ============================================================================
-- 2. SEGREGATED_ESCROWS TABLE
-- Escrows deployed from client's segregated wallet
-- ============================================================================

CREATE TABLE IF NOT EXISTS segregated_escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    
    -- XRPL Escrow Data
    tx_hash VARCHAR(64) NOT NULL UNIQUE,
    escrow_sequence INTEGER NOT NULL,
    client_wallet_address VARCHAR(34) NOT NULL, -- Client's segregated wallet (escrow owner)
    vendor_address VARCHAR(34) NOT NULL,
    
    -- Escrow Details
    amount NUMERIC(20, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- XRP or RLUSD
    condition TEXT, -- Hex-encoded crypto-condition
    encrypted_fulfillment TEXT, -- AES-256 encrypted
    
    -- Timing
    finish_after INTEGER, -- Ripple epoch time
    cancel_after INTEGER, -- Ripple epoch time
    
    -- Status
    status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'cancelled')),
    release_tx_hash VARCHAR(64),
    released_at TIMESTAMP WITH TIME ZONE,
    
    -- Agent Audit (who signed on behalf of client)
    signed_by VARCHAR(34) NOT NULL, -- Pharma Loom's RegularKey address
    signed_via VARCHAR(20) DEFAULT 'regular_key' CHECK (signed_via IN ('regular_key', 'master_key')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_milestone_segregated_escrow UNIQUE (milestone_id)
);

-- Row-Level Security
ALTER TABLE segregated_escrows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own segregated escrows"
    ON segregated_escrows FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Service can manage segregated escrows"
    ON segregated_escrows FOR ALL
    WITH CHECK (true);

-- Indexes
CREATE INDEX idx_segregated_escrows_client_id ON segregated_escrows(client_id);
CREATE INDEX idx_segregated_escrows_milestone_id ON segregated_escrows(milestone_id);
CREATE INDEX idx_segregated_escrows_status ON segregated_escrows(status);
CREATE INDEX idx_segregated_escrows_client_wallet ON segregated_escrows(client_wallet_address);

-- ============================================================================
-- 3. CLIENT_FUNDING_LOG TABLE
-- Track wire transfers and fiat → RLUSD conversions
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_funding_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Fiat On-Ramp
    fiat_amount_usd NUMERIC(20, 2) NOT NULL,
    wire_transfer_ref VARCHAR(100), -- Bank reference number
    banking_partner_txid VARCHAR(100), -- OpenPayd transaction ID
    
    -- Crypto Conversion
    rlusd_amount NUMERIC(20, 6),
    conversion_rate NUMERIC(10, 6), -- USD/RLUSD rate at time of conversion
    exchange_used VARCHAR(50), -- Bitstamp, Uphold, etc.
    exchange_txid VARCHAR(100),
    
    -- Destination
    destination_wallet VARCHAR(34), -- Client's segregated wallet
    xrpl_tx_hash VARCHAR(64), -- XRPL transaction sending RLUSD to client
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'settled', 'failed')),
    
    -- Timestamps
    wire_received_at TIMESTAMP WITH TIME ZONE,
    conversion_completed_at TIMESTAMP WITH TIME ZONE,
    xrpl_settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE client_funding_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own funding log"
    ON client_funding_log FOR SELECT
    USING (auth.uid() = client_id);

-- Indexes
CREATE INDEX idx_funding_log_client_id ON client_funding_log(client_id);
CREATE INDEX idx_funding_log_status ON client_funding_log(status);
CREATE INDEX idx_funding_log_wire_ref ON client_funding_log(wire_transfer_ref);

-- ============================================================================
-- 4. REGULAR_KEY_AUDIT_LOG TABLE
-- Track all RegularKey delegations and revocations
-- ============================================================================

CREATE TABLE IF NOT EXISTS regular_key_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(34) NOT NULL,
    
    -- Action
    action VARCHAR(20) NOT NULL CHECK (action IN ('enabled', 'revoked', 'master_key_exported')),
    regular_key_address VARCHAR(34), -- Pharma Loom's RegularKey
    xrpl_tx_hash VARCHAR(64),
    
    -- Context
    initiated_by VARCHAR(50), -- 'system', 'client_request', 'admin'
    client_approval_token VARCHAR(100), -- 2FA token if client-initiated
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE regular_key_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own regular key audit"
    ON regular_key_audit_log FOR SELECT
    USING (auth.uid() = client_id);

-- Indexes
CREATE INDEX idx_regular_key_audit_client_id ON regular_key_audit_log(client_id);
CREATE INDEX idx_regular_key_audit_action ON regular_key_audit_log(action);

-- ============================================================================
-- 5. MASTER_KEY_EXPORTS TABLE
-- Track when clients export their master keys (recovery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_key_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(34) NOT NULL,
    
    -- Security
    client_approval_token VARCHAR(100) NOT NULL, -- 2FA required
    export_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE master_key_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own master key exports"
    ON master_key_exports FOR SELECT
    USING (auth.uid() = client_id);

-- Indexes
CREATE INDEX idx_master_key_exports_client_id ON master_key_exports(client_id);

-- ============================================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_segregated_wallets_updated_at
    BEFORE UPDATE ON segregated_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segregated_escrows_updated_at
    BEFORE UPDATE ON segregated_escrows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. VIEWS FOR REPORTING
-- ============================================================================

-- Client Balance View (aggregate across wallets and escrows)
CREATE OR REPLACE VIEW client_balances AS
SELECT 
    sw.client_id,
    sw.master_address AS wallet_address,
    COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'locked'), 0) AS locked_in_escrow,
    -- Add live balance query logic here (requires external XRPL query)
    sw.last_balance_check
FROM segregated_wallets sw
LEFT JOIN segregated_escrows se ON sw.client_id = se.client_id
GROUP BY sw.client_id, sw.master_address, sw.last_balance_check;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
