-- Create admin user in Supabase
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- OPTION 1: Use Supabase Dashboard (RECOMMENDED - Easiest)
-- 1. Go to Authentication → Users in your Supabase Dashboard
-- 2. Click "Add User" or "Invite User"
-- 3. Email: tedxgjutickets@gmail.com
-- 4. Password: Tickets321
-- 5. Check "Auto Confirm User" (important!)
-- 6. Click "Create User"

-- OPTION 2: Use SQL (if dashboard method doesn't work)
-- This creates the user with a hashed password
-- Note: You'll need to enable the pgcrypto extension first

-- Enable extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the user (Supabase will hash the password automatically via trigger)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'tedxgjutickets@gmail.com',
  crypt('Tickets321', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Verify the user was created
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'tedxgjutickets@gmail.com';

