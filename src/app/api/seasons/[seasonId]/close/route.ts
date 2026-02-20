import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;

  const { data: season, error: seasonError } = await supabaseAdmin
    .from("seasons")
    .select("*")
    .eq("id", seasonId)
    .single();

  if (seasonError || !season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  if (season.status !== "active") {
    return NextResponse.json(
      { error: "Season must be active to close. Current status: " + season.status },
      { status: 400 }
    );
  }

  // Check that no finale already exists for this season
  const { data: existingFinale } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("season_id", seasonId)
    .eq("is_finale", true)
    .limit(1);

  if (existingFinale && existingFinale.length > 0) {
    return NextResponse.json(
      { error: "A finale already exists for this season" },
      { status: 400 }
    );
  }

  // Get all weekly finalists (alive participants) from this season's sessions
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("*, participants(*)")
    .eq("season_id", seasonId)
    .eq("is_finale", false);

  const finalists = (sessions || []).flatMap((session) =>
    (session.participants || [])
      .filter((p: { status: string }) => p.status === "alive")
      .map((p: { name: string; topic: string; image_url: string; demo_url?: string }) => ({
        name: p.name,
        topic: p.topic,
        image_url: p.image_url,
        demo_url: p.demo_url || "",
      }))
  );

  // Set season to "finale" status (not fully closed until finale voting ends)
  const { error: updateError } = await supabaseAdmin
    .from("seasons")
    .update({ status: "finale" })
    .eq("id", seasonId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create the Season Finale session with all finalists
  const finaleTitle = `${season.name} - Season Finale`;
  const { data: finaleSession, error: finaleError } = await supabaseAdmin
    .from("sessions")
    .insert({
      title: finaleTitle,
      week_number: 99,
      session_date: new Date().toISOString().split("T")[0],
      status: "lobby",
      season_id: seasonId,
      is_finale: true,
      pot_contribution: 0,
    })
    .select()
    .single();

  if (finaleError) {
    return NextResponse.json({ error: finaleError.message }, { status: 500 });
  }

  // Add all finalists as participants in the finale session
  if (finalists.length > 0) {
    const finaleParticipants = finalists.map((f, index) => ({
      session_id: finaleSession.id,
      name: f.name,
      topic: f.topic,
      image_url: f.image_url,
      demo_url: f.demo_url,
      player_number: index + 1,
      status: "alive",
      vote_count: 0,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("participants")
      .insert(finaleParticipants);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to add finalists: " + insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    season: { ...season, status: "finale" },
    finaleSession,
    finalistsCount: finalists.length,
  });
}
