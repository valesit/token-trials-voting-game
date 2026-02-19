import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { status } = await request.json();

  const validStatuses = ["lobby", "voting", "results", "completed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // When transitioning to "results", tally votes and mark bottom 2 as eliminated
  if (status === "results") {
    const { data: participants, error: pError } = await supabaseAdmin
      .from("participants")
      .select("id, player_number, name")
      .eq("session_id", sessionId);

    if (pError) {
      return NextResponse.json({ error: pError.message }, { status: 500 });
    }

    // Count votes per participant
    const { data: votes, error: vError } = await supabaseAdmin
      .from("votes")
      .select("participant_id")
      .eq("session_id", sessionId);

    if (vError) {
      return NextResponse.json({ error: vError.message }, { status: 500 });
    }

    const voteCounts: Record<string, number> = {};
    for (const p of participants || []) {
      voteCounts[p.id] = 0;
    }
    for (const v of votes || []) {
      voteCounts[v.participant_id] = (voteCounts[v.participant_id] || 0) + 1;
    }

    // Update vote_count on each participant
    for (const p of participants || []) {
      await supabaseAdmin
        .from("participants")
        .update({ vote_count: voteCounts[p.id] || 0 })
        .eq("id", p.id);
    }

    // Sort by votes ascending (bottom 2 are eliminated)
    const sorted = [...(participants || [])].sort(
      (a, b) => (voteCounts[a.id] || 0) - (voteCounts[b.id] || 0)
    );

    const eliminatedIds = sorted.slice(0, 2).map((p) => p.id);
    const survivorIds = sorted.slice(2).map((p) => p.id);

    await supabaseAdmin
      .from("participants")
      .update({ status: "eliminated" })
      .in("id", eliminatedIds);

    await supabaseAdmin
      .from("participants")
      .update({ status: "alive" })
      .in("id", survivorIds);
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ status })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
