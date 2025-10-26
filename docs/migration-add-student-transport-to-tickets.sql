-- Migration: Add student_id and needs_transportation columns to tickets table
-- This migration adds support for tracking GJU student IDs and transportation needs in tickets

-- Add student_id column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Add needs_transportation column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS needs_transportation TEXT;

-- Add comments explaining the columns
COMMENT ON COLUMN tickets.student_id IS 'Student ID for GJU students (optional)';
COMMENT ON COLUMN tickets.needs_transportation IS 'Whether the attendee needs transportation (Yes/No)';

-- Add indexes for filtering (optional, but useful)
CREATE INDEX IF NOT EXISTS idx_tickets_student_id ON tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_tickets_transportation ON tickets(needs_transportation);
