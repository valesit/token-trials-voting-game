import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MAX_VOTES_PER_DEVICE = 2;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { session_id, participant_ids, device_id } = body;

  // Support both single vote (participant_id) and multi-vote (participant_ids)
  const participantIdList: string[] = participant_ids
    ? participant_ids
    : body.participant_id
    ? [body.participant_id]
    : [];

  if (!session_id || participantIdList.length === 0 || !device_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify session is in voting status
  const { data: session } = await supabase
    .from("sessions")
    .select("status")
    .eq("id", session_id)
    .single();

  if (!session || session.status !== "voting") {
    return NextResponse.json(
      { error: "Voting is not currently open for this session" },
      { status: 403 }
    );
  }

  // Check how many votes this device has already cast
  const { count: existingVoteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session_id)
    .eq("device_id", device_id);

  const totalVotes = (existingVoteCount || 0) + participantIdList.length;

  if (totalVotes > MAX_VOTES_PER_DEVICE) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_VOTES_PER_DEVICE} votes allowed per device. You have ${existingVoteCount || 0} vote(s) remaining.`,
      },
      { status: 409 }
    );
  }

  // Insert all votes
  const votesToInsert = participantIdList.map((participant_id: string) => ({
    session_id,
    participant_id,
    device_id,
  }));

  const { data, error } = await supabase
    .from("votes")
    .insert(votesToInsert)
    .select();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already voted for this participant" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
