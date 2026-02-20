import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;

  // 1. Get the season to verify it exists and is active
  const { data: season, error: seasonError } = await supabaseAdmin
    .from("seasons")
    .select("*")
    .eq("id", seasonId)
    .single();

  if (seasonError || !season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  if (season.status === "closed") {
    return NextResponse.json({ error: "Season is already closed" }, { status: 400 });
  }

  // 2. Get all weekly finalists (alive participants) from this season's sessions
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

  // 3. Close the current season
  const { error: closeError } = await supabaseAdmin
    .from("seasons")
    .update({ status: "closed" })
    .eq("id", seasonId);

  if (closeError) {
    return NextResponse.json({ error: closeError.message }, { status: 500 });
  }

  // 4. Create the Season Finale session with all finalists
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
    })
    .select()
    .single();

  if (finaleError) {
    return NextResponse.json({ error: finaleError.message }, { status: 500 });
  }

  // 5. Add all finalists as participants in the finale session
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

    await supabaseAdmin.from("participants").insert(finaleParticipants);
  }

  // 6. Create a new active season
  const newSeasonNumber = parseInt(season.name.replace(/\D/g, "") || "0") + 1;
  const { data: newSeason, error: newSeasonError } = await supabaseAdmin
    .from("seasons")
    .insert({
      name: `Season ${newSeasonNumber}`,
      status: "active",
    })
    .select()
    .single();

  if (newSeasonError) {
    return NextResponse.json({ error: newSeasonError.message }, { status: 500 });
  }

  return NextResponse.json({
    closedSeason: { ...season, status: "closed" },
    finaleSession,
    finalistsCount: finalists.length,
    newSeason,
  });
}
