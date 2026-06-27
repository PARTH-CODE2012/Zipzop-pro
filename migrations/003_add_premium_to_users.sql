-- Add premium columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_expires TIMESTAMP WITH TIME ZONE NULL;
