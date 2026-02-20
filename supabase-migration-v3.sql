-- Muley SE AI Trial by Tokens - Migration v3
-- Run this on existing databases to add prize pot tracking, season winner, and finale status

-- 1. Add pot_contribution to sessions (default $25 per session)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pot_contribution INTEGER NOT NULL DEFAULT 25;

-- 2. Add winner tracking and total prize pot to seasons
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS winner_name TEXT;
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS total_prize_pot INTEGER;

-- 3. Allow 'finale' as a season status (active -> finale -> closed)
ALTER TABLE seasons DROP CONSTRAINT IF EXISTS seasons_status_check;
ALTER TABLE seasons ADD CONSTRAINT seasons_status_check
  CHECK (status IN ('active', 'finale', 'closed'));

-- 4. Allow more than 4 players per session (finales can have 6+ finalists)
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_player_number_check;
ALTER TABLE participants ADD CONSTRAINT participants_player_number_check
  CHECK (player_number BETWEEN 1 AND 99);

-- 5. Add slug column for friendly voting URLs (e.g., /vote/episode-2)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Backfill slugs for existing sessions (uses season name number + week/finale)
UPDATE sessions s
SET slug = 's' || COALESCE(REGEXP_REPLACE(sea.name, '\D', '', 'g'), '0') || '-ep-' || s.week_number
FROM seasons sea
WHERE s.season_id = sea.id AND s.slug IS NULL AND s.is_finale = false;

UPDATE sessions s
SET slug = 's' || COALESCE(REGEXP_REPLACE(sea.name, '\D', '', 'g'), '0') || '-finale'
FROM seasons sea
WHERE s.season_id = sea.id AND s.slug IS NULL AND s.is_finale = true;

UPDATE sessions SET slug = 'ep-' || week_number WHERE slug IS NULL AND is_finale = false;
UPDATE sessions SET slug = 'finale-' || LEFT(id::text, 8) WHERE slug IS NULL AND is_finale = true;
