import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { session_id, participant_id, device_id } = await request.json();

  if (!session_id || !participant_id || !device_id) {
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

  const { data, error } = await supabase
    .from("votes")
    .insert({ session_id, participant_id, device_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already voted in this session" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
