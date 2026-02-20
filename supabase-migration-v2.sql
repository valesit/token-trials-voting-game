-- Muley SE AI Squid Games - Migration v2
-- Run this on existing databases to add season/finale support, multi-vote, and demo URLs

-- 1. Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add season_id and is_finale columns to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_finale BOOLEAN DEFAULT false;

-- 3. Add demo_url column to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS demo_url TEXT NOT NULL DEFAULT '';

-- 4. Update votes table constraint to allow multi-vote (1-2 votes per device)
-- First drop the old constraint if it exists
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_session_id_device_id_key;
-- Add the new constraint allowing same device to vote for multiple participants
ALTER TABLE votes ADD CONSTRAINT votes_session_device_participant UNIQUE(session_id, device_id, participant_id);

-- 5. Enable RLS on seasons table
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policy for seasons
CREATE POLICY "Anyone can read seasons"
  ON seasons FOR SELECT USING (true);

-- 7. Enable Realtime for seasons
ALTER PUBLICATION supabase_realtime ADD TABLE seasons;
