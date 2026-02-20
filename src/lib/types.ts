export type SessionStatus = "lobby" | "voting" | "results" | "completed";
export type ParticipantStatus = "alive" | "eliminated";
export type SeasonStatus = "active" | "finale" | "closed";

export interface Season {
  id: string;
  name: string;
  status: SeasonStatus;
  winner_name: string | null;
  total_prize_pot: number | null;
  created_at: string;
}

export interface Session {
  id: string;
  slug: string;
  title: string;
  week_number: number;
  session_date: string;
  status: SessionStatus;
  season_id: string | null;
  is_finale: boolean;
  pot_contribution: number;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  topic: string;
  image_url: string;
  player_number: number;
  status: ParticipantStatus;
  vote_count: number;
  demo_url: string;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  participant_id: string;
  device_id: string;
  created_at: string;
}

export interface SessionWithParticipants extends Session {
  participants: Participant[];
}

export interface SeasonWithSessions extends Season {
  sessions: SessionWithParticipants[];
}
