"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Session, Participant } from "@/lib/types";
import { getDeviceId } from "@/lib/device-id";
import ParticipantCard from "@/components/ParticipantCard";
import EliminationOverlay from "@/components/EliminationOverlay";
import SoundController from "@/components/SoundController";
import { FloatingShapes } from "@/components/SquidShapes";
import MuleyLogo from "@/components/MuleyLogo";

const MAX_SELECTIONS = 2;

export default function VotePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(false);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [showElimination, setShowElimination] = useState(false);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [runningPotTotal, setRunningPotTotal] = useState(0);
  const [previousPotTotal, setPreviousPotTotal] = useState(0);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else if (newSet.size < MAX_SELECTIONS) {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const fetchSession = useCallback(async () => {
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    const { data: participantData } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("player_number");

    if (sessionData) setSession(sessionData);
    if (participantData) setParticipants(participantData);

    // Fetch all sessions in the same season to compute prize pot
    if (sessionData?.season_id) {
      const { data: seasonSessions } = await supabase
        .from("sessions")
        .select("week_number, pot_contribution, is_finale")
        .eq("season_id", sessionData.season_id);

      if (seasonSessions) {
        const total = seasonSessions.reduce(
          (sum, s) => sum + (s.pot_contribution || 25),
          0
        );
        setRunningPotTotal(total);

        const previous = seasonSessions
          .filter(
            (s) =>
              !s.is_finale && s.week_number < sessionData.week_number
          )
          .reduce((sum, s) => sum + (s.pot_contribution || 25), 0);
        setPreviousPotTotal(previous);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Real-time subscription for session status changes
  useEffect(() => {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          if (updated.status === "results") {
            fetchSession();
            setTimeout(() => setShowElimination(true), 500);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        () => {
          fetchSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchSession]);

  async function submitVote() {
    if (selectedIds.size === 0) return;
    setVoteSubmitting(true);
    setError("");

    const deviceId = getDeviceId();

    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        participant_ids: Array.from(selectedIds),
        device_id: deviceId,
      }),
    });

    if (res.ok) {
      setHasVoted(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to submit vote");
    }
    setVoteSubmitting(false);
  }

  const eliminated = participants.filter((p) => p.status === "eliminated");
  const survivors = participants.filter((p) => p.status === "alive");

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-[family-name:var(--font-heading)] text-3xl text-squid-pink animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
      <FloatingShapes />
      <EliminationOverlay
        show={showElimination}
        eliminated={eliminated}
        survivors={survivors}
        onComplete={() => setShowElimination(false)}
        currentPotValue={runningPotTotal}
        previousPotValue={previousPotTotal}
        isFinale={session.is_finale}
      />

      {/* Sound controller - top right */}
      <div className="fixed top-4 right-4 z-30">
        <SoundController
          isVoting={session.status === "voting"}
          eliminatedPlayers={eliminated.map((p) => ({
            player_number: p.player_number,
            name: p.name,
          }))}
          triggerElimination={showElimination}
          enabled={soundEnabled}
          onToggle={setSoundEnabled}
        />
      </div>

      <div className="relative z-20 w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <MuleyLogo size="sm" animated variant="squid" />
            <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl text-squid-pink tracking-wider glitch-text">
              {session.title || `WEEK ${session.week_number}`}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="w-3 h-3 rounded-full border border-squid-pink" />
            <svg viewBox="0 0 100 100" className="w-3 h-3">
              <polygon points="50,5 95,95 5,95" fill="none" stroke="#FF287E" strokeWidth="8" />
            </svg>
            <div className="w-3 h-3 border border-squid-pink" />
          </div>
        </motion.div>

        {/* Lobby state */}
        <AnimatePresence mode="wait">
          {session.status === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-full border-4 border-squid-pink mx-auto mb-8 flex items-center justify-center"
              >
                <span className="font-[family-name:var(--font-heading)] text-5xl text-squid-pink">
                  ...
                </span>
              </motion.div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl text-squid-light/60 tracking-wider">
                WAITING FOR THE GAME TO BEGIN
              </h2>
              <p className="text-squid-light/30 mt-4">
                The host will open voting shortly. Stay on this page.
              </p>
            </motion.div>
          )}

          {/* Voting state */}
          {session.status === "voting" && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {hasVoted ? (
                <div className="text-center py-16">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-24 h-24 rounded-full bg-squid-green/20 border-4 border-squid-green mx-auto mb-6 flex items-center justify-center"
                  >
                    <svg className="w-12 h-12 text-squid-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl text-squid-green tracking-wider">
                    VOTE SUBMITTED
                  </h2>
                  <p className="text-squid-light/40 mt-2">
                    Your fate is sealed. Waiting for results...
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="font-[family-name:var(--font-heading)] text-2xl text-squid-green text-center tracking-wider mb-2">
                    SELECT 1 OR 2 CHAMPIONS
                  </h2>
                  <p className="text-squid-light/40 text-center text-sm mb-6">
                    You can vote for up to 2 participants
                    {selectedIds.size > 0 && (
                      <span className="text-squid-green ml-2">
                        ({selectedIds.size}/{MAX_SELECTIONS} selected)
                      </span>
                    )}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {participants.map((p) => (
                      <ParticipantCard
                        key={p.id}
                        participant={p}
                        selected={selectedIds.has(p.id)}
                        onClick={() => toggleSelection(p.id)}
                        disabled={!selectedIds.has(p.id) && selectedIds.size >= MAX_SELECTIONS}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-squid-red text-center mb-4"
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="text-center">
                    <button
                      onClick={submitVote}
                      disabled={selectedIds.size === 0 || voteSubmitting}
                      className="px-12 py-4 bg-squid-pink text-white font-[family-name:var(--font-heading)] text-2xl tracking-wider rounded-xl hover:bg-squid-pink-dark transition-all disabled:opacity-30 disabled:cursor-not-allowed pulse-glow"
                    >
                      {voteSubmitting
                        ? "SUBMITTING..."
                        : `CAST ${selectedIds.size === 1 ? "VOTE" : "VOTES"}`}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Results state */}
          {(session.status === "results" || session.status === "completed") && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="font-[family-name:var(--font-heading)] text-3xl text-center text-squid-gold tracking-wider mb-8">
                {session.status === "completed" ? "FINAL RESULTS" : "THE RESULTS ARE IN"}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {participants
                  .sort((a, b) => b.vote_count - a.vote_count)
                  .map((p) => (
                    <ParticipantCard
                      key={p.id}
                      participant={p}
                      showVotes
                      revealMode
                      disabled
                    />
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
