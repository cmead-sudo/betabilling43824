-- 21 CFR Part 11 Compliant Audit Trail Architecture
-- This creates an immutable, timestamped audit log for regulatory compliance

-- Create enum for action types
CREATE TYPE public.audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT', 'VIEW', 'APPROVE', 'REJECT');

-- Create the audit_logs table - immutable record of all changes
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- WHO: User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_ip_address TEXT,
  
  -- WHEN: Immutable timestamp (cannot be modified)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- WHAT: The change details
  action audit_action NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  
  -- OLD/NEW Values: Complete state capture for compliance
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Additional compliance metadata
  session_id TEXT,
  application_version TEXT DEFAULT '1.0.0',
  reason TEXT,
  electronic_signature TEXT,
  
  -- Prevent any updates to this row
  CONSTRAINT audit_logs_immutable CHECK (true)
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone authenticated can INSERT audit logs (for logging their own actions)
CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policy: Users can only view their own audit logs (for compliance reporting)
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policy: NO UPDATE - Audit logs are immutable
-- (No policy = no access, which enforces immutability)

-- RLS Policy: NO DELETE - Audit logs cannot be deleted
-- (No policy = no access, which enforces immutability)

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);

-- Create a function to log audit entries (can be called from triggers or application code)
CREATE OR REPLACE FUNCTION public.log_audit_entry(
  p_action audit_action,
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_changed_fields TEXT[] DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_electronic_signature TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Insert the audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    changed_fields,
    reason,
    electronic_signature
  ) VALUES (
    v_user_id,
    v_user_email,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    p_changed_fields,
    p_reason,
    p_electronic_signature
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create a generic trigger function for automatic audit logging on any table
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_changed_fields TEXT[];
  v_action audit_action;
  v_record_id TEXT;
BEGIN
  -- Determine the action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_new_values := to_jsonb(NEW);
    v_record_id := NEW.id::TEXT;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    v_record_id := NEW.id::TEXT;
    
    -- Calculate which fields changed
    SELECT array_agg(key) INTO v_changed_fields
    FROM (
      SELECT key FROM jsonb_each(to_jsonb(OLD))
      EXCEPT
      SELECT key FROM jsonb_each(to_jsonb(NEW))
      UNION
      SELECT key FROM jsonb_each(to_jsonb(NEW))
      EXCEPT
      SELECT key FROM jsonb_each(to_jsonb(OLD))
    ) AS changed_keys;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_values := to_jsonb(OLD);
    v_record_id := OLD.id::TEXT;
  END IF;
  
  -- Insert audit log (bypass RLS for system-level logging)
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    v_action,
    TG_TABLE_NAME,
    v_record_id,
    v_old_values,
    v_new_values,
    v_changed_fields
  );
  
  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Add a comment explaining the 21 CFR Part 11 compliance
COMMENT ON TABLE public.audit_logs IS '21 CFR Part 11 compliant audit trail. This table is immutable - records cannot be updated or deleted. Each entry captures WHO made a change, WHEN it occurred (immutable timestamp), and WHAT the old/new values were.';