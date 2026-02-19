export type SessionStatus = "lobby" | "voting" | "results" | "completed";
export type ParticipantStatus = "alive" | "eliminated";

export interface Session {
  id: string;
  title: string;
  week_number: number;
  session_date: string;
  status: SessionStatus;
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
