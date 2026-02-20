-- Muley SE AI Trial by Tokens - Database Schema
-- Run this in your Supabase SQL Editor to set up the database.

-- Seasons table for tracking competition seasons
CREATE TABLE seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finale', 'closed')),
  winner_name TEXT,
  total_prize_pot INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'voting', 'results', 'completed')),
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  is_finale BOOLEAN DEFAULT false,
  pot_contribution INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  player_number INTEGER NOT NULL CHECK (player_number BETWEEN 1 AND 99),
  status TEXT NOT NULL DEFAULT 'alive'
    CHECK (status IN ('alive', 'eliminated')),
  vote_count INTEGER NOT NULL DEFAULT 0,
  demo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, device_id, participant_id)
);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE seasons;

-- Row Level Security
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read seasons"
  ON seasons FOR SELECT USING (true);

CREATE POLICY "Anyone can read sessions"
  ON sessions FOR SELECT USING (true);

CREATE POLICY "Anyone can read participants"
  ON participants FOR SELECT USING (true);

CREATE POLICY "Anyone can read votes"
  ON votes FOR SELECT USING (true);

-- Votes can only be inserted when the session is in 'voting' status
CREATE POLICY "Insert votes only during voting phase"
  ON votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = votes.session_id
        AND sessions.status = 'voting'
    )
  );
