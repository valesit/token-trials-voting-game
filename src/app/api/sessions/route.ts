import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*, participants(*)")
    .order("week_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, week_number, session_date, season_id, pot_contribution, slug } = body;

  const generatedSlug = slug || `episode-${week_number}`;

  // Ensure slug uniqueness by appending a suffix if needed
  let finalSlug = generatedSlug;
  const { data: existing } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("slug", generatedSlug)
    .limit(1);

  if (existing && existing.length > 0) {
    finalSlug = `${generatedSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      title,
      week_number,
      session_date,
      season_id: season_id || null,
      pot_contribution: pot_contribution ?? 25,
      slug: finalSlug,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
