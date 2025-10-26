-- Migration: Add student_id and needs_transportation columns to purchase_requests table
-- This migration adds support for tracking GJU student IDs and transportation needs

-- Add student_id column
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Add needs_transportation column
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS needs_transportation TEXT;

-- Add comments explaining the columns
COMMENT ON COLUMN purchase_requests.student_id IS 'Student ID for GJU students (optional)';
COMMENT ON COLUMN purchase_requests.needs_transportation IS 'Whether the attendee needs transportation (Yes/No)';

-- Add indexes for filtering (optional, but useful)
CREATE INDEX IF NOT EXISTS idx_purchase_requests_student_id ON purchase_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_transportation ON purchase_requests(needs_transportation);
