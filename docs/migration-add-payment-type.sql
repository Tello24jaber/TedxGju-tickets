-- Migration: Add payment_type column to purchase_requests table
-- This migration adds support for tracking the payment method (Cash, Cliq, etc.)

-- Add payment_type column
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN purchase_requests.payment_type IS 'Payment method used: Cash, Cliq, etc. If Cash, proof_url may be empty.';

-- Add index for filtering by payment type (optional, but useful for analytics)
CREATE INDEX IF NOT EXISTS idx_purchase_requests_payment_type ON purchase_requests(payment_type);
