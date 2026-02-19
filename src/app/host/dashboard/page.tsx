"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Session, Participant, SessionStatus } from "@/lib/types";
import SoundController from "@/components/SoundController";
import EliminationOverlay from "@/components/EliminationOverlay";

export default function HostDashboard() {
  const [sessions, setSessions] = useState<(Session & { participants: Participant[] })[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showElimination, setShowElimination] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({ title: "", week_number: 1, session_date: "" });
  const [newParticipant, setNewParticipant] = useState({ name: "", topic: "", image_url: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const currentSession = sessions.find((s) => s.id === selectedSession);
  const participants = currentSession?.participants || [];
  const eliminated = participants.filter((p) => p.status === "eliminated");
  const survivors = participants.filter((p) => p.status === "alive");

  async function createSession() {
    setActionLoading(true);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSession),
    });
    setNewSession({ title: "", week_number: 1, session_date: "" });
    setShowCreateForm(false);
    await fetchSessions();
    setActionLoading(false);
  }

  async function addParticipant() {
    if (!selectedSession) return;
    setActionLoading(true);
    await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newParticipant,
        session_id: selectedSession,
        player_number: participants.length + 1,
      }),
    });
    setNewParticipant({ name: "", topic: "", image_url: "" });
    await fetchSessions();
    setActionLoading(false);
  }

  async function updateSessionStatus(status: SessionStatus) {
    if (!selectedSession) return;
    setActionLoading(true);
    await fetch(`/api/sessions/${selectedSession}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchSessions();
    setActionLoading(false);

    if (status === "results") {
      setShowElimination(true);
    }
  }

  async function removeParticipant(id: string) {
    setActionLoading(true);
    await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
    await fetchSessions();
    setActionLoading(false);
  }

  const statusFlow: Record<SessionStatus, { next: SessionStatus; label: string; color: string }> = {
    lobby: { next: "voting", label: "OPEN VOTING", color: "bg-squid-green" },
    voting: { next: "results", label: "CLOSE & REVEAL", color: "bg-squid-red" },
    results: { next: "completed", label: "COMPLETE SESSION", color: "bg-squid-gold text-squid-black" },
    completed: { next: "completed", label: "SESSION ENDED", color: "bg-squid-grey" },
  };

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
    <div className="min-h-screen p-6 md:p-8">
      <EliminationOverlay
        show={showElimination}
        eliminated={eliminated}
        survivors={survivors}
        onComplete={() => setShowElimination(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl text-squid-pink tracking-wider">
            GAME MASTER
          </h1>
          <p className="text-squid-light/40 text-sm">How We AI - Control Panel</p>
        </div>
        <SoundController
          isVoting={currentSession?.status === "voting"}
          eliminatedPlayers={eliminated.map((p) => ({
            player_number: p.player_number,
            name: p.name,
          }))}
          triggerElimination={showElimination}
          enabled={soundEnabled}
          onToggle={setSoundEnabled}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <div className="bg-squid-dark border border-squid-grey rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl text-squid-light tracking-wider">
                SESSIONS
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-8 h-8 rounded-full bg-squid-pink flex items-center justify-center text-white text-xl leading-none hover:bg-squid-pink-dark transition-colors"
              >
                +
              </button>
            </div>

            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-3 p-4 bg-squid-darker rounded-xl border border-squid-grey">
                    <input
                      type="text"
                      placeholder="Title (e.g., How We AI - Week 3)"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      className="w-full px-3 py-2 bg-squid-black border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-pink"
                    />
                    <input
                      type="number"
                      placeholder="Week number"
                      value={newSession.week_number}
                      onChange={(e) =>
                        setNewSession({ ...newSession, week_number: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-3 py-2 bg-squid-black border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-pink"
                    />
                    <input
                      type="date"
                      value={newSession.session_date}
                      onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                      className="w-full px-3 py-2 bg-squid-black border border-squid-grey rounded-lg text-squid-light text-sm focus:outline-none focus:border-squid-pink"
                    />
                    <button
                      onClick={createSession}
                      disabled={actionLoading || !newSession.title || !newSession.session_date}
                      className="w-full py-2 bg-squid-pink text-white rounded-lg text-sm font-[family-name:var(--font-heading)] tracking-wider hover:bg-squid-pink-dark disabled:opacity-50 transition-all"
                    >
                      CREATE SESSION
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedSession === session.id
                      ? "border-squid-pink bg-squid-pink/10"
                      : "border-squid-grey hover:border-squid-light/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-heading)] text-lg text-squid-light tracking-wider">
                      WEEK {session.week_number}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === "voting"
                          ? "bg-squid-green/20 text-squid-green"
                          : session.status === "completed"
                          ? "bg-squid-grey text-squid-light/40"
                          : session.status === "results"
                          ? "bg-squid-gold/20 text-squid-gold"
                          : "bg-squid-pink/20 text-squid-pink"
                      }`}
                    >
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-squid-light/40 mt-1">{session.title}</p>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-squid-light/30 py-8 text-sm">
                  No sessions yet. Create one to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Session Detail */}
        <div className="lg:col-span-2">
          {currentSession ? (
            <div className="space-y-6">
              {/* Status & Controls */}
              <div className="bg-squid-dark border border-squid-grey rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl text-squid-light tracking-wider">
                      {currentSession.title}
                    </h2>
                    <p className="text-squid-light/40 text-sm mt-1">
                      Status:{" "}
                      <span className="text-squid-pink uppercase font-bold">
                        {currentSession.status}
                      </span>
                      {" | "}
                      Share voting link:{" "}
                      <span className="text-squid-green font-[family-name:var(--font-mono)] text-xs">
                        /vote/{currentSession.id}
                      </span>
                    </p>
                  </div>

                  {currentSession.status !== "completed" && (
                    <button
                      onClick={() =>
                        updateSessionStatus(statusFlow[currentSession.status].next)
                      }
                      disabled={
                        actionLoading ||
                        (currentSession.status === "lobby" && participants.length < 2)
                      }
                      className={`px-6 py-3 rounded-xl font-[family-name:var(--font-heading)] text-xl tracking-wider text-white transition-all disabled:opacity-50 ${
                        statusFlow[currentSession.status].color
                      }`}
                    >
                      {actionLoading ? "..." : statusFlow[currentSession.status].label}
                    </button>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="bg-squid-dark border border-squid-grey rounded-2xl p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-2xl text-squid-light tracking-wider mb-4">
                  PLAYERS ({participants.length}/4)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {participants
                    .sort((a, b) => a.player_number - b.player_number)
                    .map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          p.status === "eliminated"
                            ? "border-squid-pink/30 bg-squid-pink/5"
                            : "border-squid-grey"
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 ${
                            p.status === "eliminated"
                              ? "border-squid-pink grayscale opacity-50"
                              : "border-squid-green"
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
                            <div className="w-full h-full flex items-center justify-center bg-squid-darker text-lg font-[family-name:var(--font-heading)] text-squid-grey">
                              {p.player_number}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-[family-name:var(--font-heading)] text-lg text-squid-light tracking-wider">
                              #{p.player_number} {p.name}
                            </span>
                            {p.status === "eliminated" && (
                              <span className="text-xs text-squid-pink">ELIMINATED</span>
                            )}
                          </div>
                          <p className="text-xs text-squid-light/40 truncate">{p.topic}</p>
                          {currentSession.status !== "lobby" && (
                            <p className="text-xs text-squid-green mt-1">
                              {p.vote_count} votes
                            </p>
                          )}
                        </div>
                        {currentSession.status === "lobby" && (
                          <button
                            onClick={() => removeParticipant(p.id)}
                            className="text-squid-red/50 hover:text-squid-red text-sm transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                </div>

                {/* Add Participant form */}
                {currentSession.status === "lobby" && participants.length < 4 && (
                  <div className="border-t border-squid-grey pt-4">
                    <h4 className="font-[family-name:var(--font-heading)] text-lg text-squid-light/60 tracking-wider mb-3">
                      ADD PLAYER
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newParticipant.name}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, name: e.target.value })
                        }
                        className="px-3 py-2 bg-squid-darker border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-pink"
                      />
                      <input
                        type="text"
                        placeholder="Demo topic"
                        value={newParticipant.topic}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, topic: e.target.value })
                        }
                        className="px-3 py-2 bg-squid-darker border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-pink"
                      />
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={newParticipant.image_url}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, image_url: e.target.value })
                        }
                        className="px-3 py-2 bg-squid-darker border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-pink"
                      />
                    </div>
                    <button
                      onClick={addParticipant}
                      disabled={actionLoading || !newParticipant.name}
                      className="mt-3 px-6 py-2 bg-squid-green text-white rounded-lg text-sm font-[family-name:var(--font-heading)] tracking-wider hover:bg-squid-green-dark disabled:opacity-50 transition-all"
                    >
                      ADD PLAYER #{participants.length + 1}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-squid-dark border border-squid-grey rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-full border-4 border-squid-grey mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl text-squid-grey">?</span>
              </div>
              <p className="text-squid-light/30 font-[family-name:var(--font-heading)] text-xl tracking-wider">
                SELECT A SESSION
              </p>
              <p className="text-squid-light/20 text-sm mt-2">
                Choose a session from the left panel or create a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
