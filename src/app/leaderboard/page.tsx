"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Session, Participant } from "@/lib/types";
import { FloatingShapes } from "@/components/SquidShapes";
import Link from "next/link";

interface SessionWithParticipants extends Session {
  participants: Participant[];
}

export default function LeaderboardPage() {
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from("sessions")
        .select("*, participants(*)")
        .in("status", ["results", "completed"])
        .order("week_number", { ascending: true });

      if (data) setSessions(data);
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  // Collect all surviving participants across sessions for the finals tracker
  const allSurvivors = sessions.flatMap((s) =>
    s.participants
      .filter((p) => p.status === "alive")
      .map((p) => ({ ...p, week: s.week_number, sessionTitle: s.title }))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-[family-name:var(--font-heading)] text-3xl text-squid-pink animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-6 md:p-8">
      <FloatingShapes />

      <div className="relative z-20 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="text-squid-light/30 text-sm hover:text-squid-light/60 transition-colors"
          >
            &larr; Back to Home
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl md:text-7xl text-squid-pink glitch-text mt-4 mb-2">
            LEADERBOARD
          </h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-3 h-3 rounded-full border border-squid-pink" />
            <svg viewBox="0 0 100 100" className="w-3 h-3">
              <polygon points="50,5 95,95 5,95" fill="none" stroke="#FF287E" strokeWidth="8" />
            </svg>
            <div className="w-3 h-3 border border-squid-pink" />
          </div>
          <p className="text-squid-light/40">
            How We AI - Quarter Finals Tracker
          </p>
        </div>

        {/* Finals Qualifiers Summary */}
        {allSurvivors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="font-[family-name:var(--font-heading)] text-3xl text-squid-green tracking-wider text-center mb-6">
              QUARTER-FINALS QUALIFIERS
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {allSurvivors.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-squid-green shadow-[0_0_20px_rgba(3,196,161,0.3)] mx-auto mb-2">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-squid-darker text-2xl font-[family-name:var(--font-heading)] text-squid-green">
                        {p.player_number}
                      </div>
                    )}
                  </div>
                  <p className="font-[family-name:var(--font-heading)] text-lg text-squid-green tracking-wider">
                    {p.name}
                  </p>
                  <p className="text-xs text-squid-light/40">Week {p.week}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Horizontal separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-squid-pink/30 to-transparent mb-12" />

        {/* Week-by-Week Results */}
        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full border-4 border-squid-grey mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-squid-grey">?</span>
            </div>
            <p className="font-[family-name:var(--font-heading)] text-2xl text-squid-light/30 tracking-wider">
              NO GAMES PLAYED YET
            </p>
            <p className="text-squid-light/20 mt-2 text-sm">
              Results will appear here after the first voting session.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Week Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-squid-pink/20 border-2 border-squid-pink flex items-center justify-center shrink-0">
                    <span className="font-[family-name:var(--font-heading)] text-xl text-squid-pink">
                      {session.week_number}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-2xl text-squid-light tracking-wider">
                      WEEK {session.week_number}
                    </h3>
                    <p className="text-xs text-squid-light/40">{session.title}</p>
                  </div>
                  <div className="flex-1 h-px bg-squid-grey" />
                </div>

                {/* Participants Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {session.participants
                    .sort((a, b) => a.player_number - b.player_number)
                    .map((p) => {
                      const isEliminated = p.status === "eliminated";
                      return (
                        <div
                          key={p.id}
                          className={`relative rounded-2xl overflow-hidden border-2 ${
                            isEliminated
                              ? "border-squid-pink/30"
                              : "border-squid-green shadow-[0_0_15px_rgba(3,196,161,0.2)]"
                          } bg-squid-dark`}
                        >
                          {/* Player number */}
                          <div
                            className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                              isEliminated ? "bg-squid-pink/50" : "bg-squid-green"
                            }`}
                          >
                            <span className="font-[family-name:var(--font-heading)] text-sm text-white">
                              {p.player_number}
                            </span>
                          </div>

                          {/* Image */}
                          <div
                            className={`aspect-square relative ${
                              isEliminated ? "grayscale brightness-50 opacity-60" : ""
                            }`}
                          >
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-squid-darker text-5xl font-[family-name:var(--font-heading)] text-squid-grey">
                                {p.player_number}
                              </div>
                            )}
                          </div>

                          {/* Eliminated X */}
                          {isEliminated && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[6rem] font-[family-name:var(--font-heading)] text-squid-pink/70 drop-shadow-[0_0_20px_rgba(255,40,126,0.6)]">
                                X
                              </span>
                            </div>
                          )}

                          {/* Info */}
                          <div className="p-3">
                            <p className="font-[family-name:var(--font-heading)] text-lg text-squid-light tracking-wider">
                              {p.name}
                            </p>
                            {p.topic && (
                              <p className="text-xs text-squid-light/40 line-clamp-1">
                                {p.topic}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-[family-name:var(--font-mono)] text-sm text-squid-light/60">
                                {p.vote_count} votes
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                  isEliminated
                                    ? "bg-squid-pink/20 text-squid-pink"
                                    : "bg-squid-green/20 text-squid-green"
                                }`}
                              >
                                {isEliminated ? "OUT" : "ALIVE"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
