"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Session, Participant, SessionStatus, Season } from "@/lib/types";
import SoundController from "@/components/SoundController";
import EliminationOverlay from "@/components/EliminationOverlay";
import MuleyLogo from "@/components/MuleyLogo";

type SessionWithParticipants = Session & { participants: Participant[] };
type SeasonWithSessions = Season & { sessions: SessionWithParticipants[] };

export default function HostDashboard() {
  const [seasons, setSeasons] = useState<SeasonWithSessions[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showElimination, setShowElimination] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [showPastSeasons, setShowPastSeasons] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSession, setNewSession] = useState({ title: "", week_number: 1, session_date: "", pot_contribution: 25 });
  const [newParticipant, setNewParticipant] = useState({ name: "", topic: "", image_url: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "session" | "season"; id: string } | null>(null);
  const [editingDemoUrl, setEditingDemoUrl] = useState<{ id: string; url: string } | null>(null);

  const activeSeason = seasons.find((s) => s.status === "active" || s.status === "finale");
  const pastSeasons = seasons.filter((s) => s.status === "closed");

  const activeSeasonSessions = activeSeason?.sessions || [];
  const allActiveSessions = activeSeasonSessions;

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/seasons");
    const data = await res.json();
    setSeasons(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const currentSession = allActiveSessions.find((s) => s.id === selectedSession)
    || pastSeasons.flatMap((s) => s.sessions).find((s) => s.id === selectedSession);
  const participants = currentSession?.participants || [];
  const eliminated = participants.filter((p) => p.status === "eliminated");
  const survivors = participants.filter((p) => p.status === "alive");

  const runningPotTotal = activeSeasonSessions
    .filter((s) => !s.is_finale)
    .reduce((sum, s) => sum + (s.pot_contribution ?? 25), 0);
  const previousPotTotal = currentSession
    ? activeSeasonSessions
        .filter((s) => s.week_number < currentSession.week_number && !s.is_finale)
        .reduce((sum, s) => sum + (s.pot_contribution ?? 25), 0)
    : 0;

  async function createSeason() {
    if (!newSeasonName.trim()) return;
    setActionLoading(true);
    await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSeasonName }),
    });
    setNewSeasonName("");
    setShowSeasonForm(false);
    await fetchAll();
    setActionLoading(false);
  }

  async function closeSeason() {
    if (!activeSeason) return;
    setActionLoading(true);
    await fetch(`/api/seasons/${activeSeason.id}/close`, { method: "PATCH" });
    await fetchAll();
    setActionLoading(false);
  }

  async function deleteSession(id: string) {
    setActionLoading(true);
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    if (selectedSession === id) setSelectedSession(null);
    await fetchAll();
    setActionLoading(false);
  }

  async function deleteSeason(id: string) {
    setActionLoading(true);
    await fetch(`/api/seasons?id=${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await fetchAll();
    setActionLoading(false);
  }

  async function createSession() {
    setActionLoading(true);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newSession,
        season_id: activeSeason?.id,
        pot_contribution: newSession.pot_contribution || 25,
      }),
    });
    setNewSession({ title: "", week_number: 1, session_date: "", pot_contribution: 25 });
    setShowCreateForm(false);
    await fetchAll();
    setActionLoading(false);
  }

  async function updateDemoUrl(participantId: string, demoUrl: string) {
    setActionLoading(true);
    await fetch("/api/participants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: participantId, demo_url: demoUrl }),
    });
    setEditingDemoUrl(null);
    await fetchAll();
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
    await fetchAll();
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
    await fetchAll();
    setActionLoading(false);

    if (status === "results") {
      setShowElimination(true);
    }
  }

  async function removeParticipant(id: string) {
    setActionLoading(true);
    await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
    await fetchAll();
    setActionLoading(false);
  }

  const statusFlow: Record<SessionStatus, { next: SessionStatus; label: string; color: string }> = {
    lobby: { next: "voting", label: "OPEN VOTING", color: "bg-squid-green" },
    voting: { next: "results", label: "CLOSE & REVEAL", color: "bg-squid-red" },
    results: { next: "completed", label: "COMPLETE SESSION", color: "bg-squid-gold text-squid-black" },
    completed: { next: "completed", label: "SESSION ENDED", color: "bg-squid-grey" },
  };

  const isCurrentSessionFromActiveSeason = currentSession && activeSeason
    && currentSession.season_id === activeSeason.id;

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
        currentPotValue={runningPotTotal}
        previousPotValue={previousPotTotal}
        isFinale={currentSession?.is_finale || false}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <MuleyLogo size="md" animated variant="squid" className="shrink-0" />
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl text-squid-pink tracking-wider">
              GAME MASTER
            </h1>
            <p className="text-squid-light/40 text-sm">Trial by Tokens - Control Panel · MuleSoft SEs</p>
          </div>
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

      {/* Season Management */}
      <div className="bg-squid-dark border border-squid-gold/30 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-squid-gold tracking-wider">
                {activeSeason ? activeSeason.name.toUpperCase() : "NO ACTIVE SEASON"}
              </h2>
              {activeSeason?.status === "finale" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-squid-gold/20 text-squid-gold">
                  FINALE IN PROGRESS
                </span>
              )}
            </div>
            <p className="text-squid-light/40 text-xs">
              {activeSeason
                ? `${activeSeasonSessions.filter((s) => !s.is_finale).length} sessions · Prize Pot: $${runningPotTotal}`
                : "Create a season to start tracking"}
            </p>
          </div>
          <div className="flex gap-2">
            {!activeSeason && (
              <button
                onClick={() => setShowSeasonForm(true)}
                className="px-4 py-2 bg-squid-gold text-squid-black rounded-lg text-sm font-[family-name:var(--font-heading)] tracking-wider hover:bg-squid-gold/80 transition-all"
              >
                CREATE SEASON
              </button>
            )}
            {activeSeason && activeSeason.status === "active" && (
              <button
                onClick={closeSeason}
                disabled={actionLoading}
                className="px-4 py-2 bg-squid-red text-white rounded-lg text-sm font-[family-name:var(--font-heading)] tracking-wider hover:bg-squid-red/80 transition-all disabled:opacity-50"
              >
                CLOSE SEASON & CREATE FINALE
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showSeasonForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Season name (e.g., Season 1)"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-squid-black border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-gold"
                />
                <button
                  onClick={createSeason}
                  disabled={actionLoading || !newSeasonName.trim()}
                  className="px-4 py-2 bg-squid-gold text-squid-black rounded-lg text-sm font-[family-name:var(--font-heading)] tracking-wider hover:bg-squid-gold/80 disabled:opacity-50 transition-all"
                >
                  CREATE
                </button>
                <button
                  onClick={() => setShowSeasonForm(false)}
                  className="px-4 py-2 bg-squid-grey text-squid-light rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-squid-black/80"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-squid-dark border border-squid-red rounded-2xl p-6 max-w-md mx-4"
            >
              <h3 className="font-[family-name:var(--font-heading)] text-2xl text-squid-red mb-4">
                CONFIRM DELETE
              </h3>
              <p className="text-squid-light/60 mb-6">
                Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    confirmDelete.type === "session"
                      ? deleteSession(confirmDelete.id)
                      : deleteSeason(confirmDelete.id)
                  }
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-squid-red text-white rounded-lg font-[family-name:var(--font-heading)] tracking-wider hover:bg-squid-red/80 disabled:opacity-50"
                >
                  DELETE
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 bg-squid-grey text-squid-light rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List - CURRENT SEASON ONLY */}
        <div className="lg:col-span-1">
          <div className="bg-squid-dark border border-squid-grey rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl text-squid-light tracking-wider">
                SESSIONS
              </h2>
              {activeSeason && activeSeason.status === "active" && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="w-8 h-8 rounded-full bg-squid-pink flex items-center justify-center text-white text-xl leading-none hover:bg-squid-pink-dark transition-colors"
                >
                  +
                </button>
              )}
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
                    <div>
                      <label className="text-xs text-squid-light/40 mb-1 block">Pot Contribution ($)</label>
                      <input
                        type="number"
                        placeholder="25"
                        value={newSession.pot_contribution}
                        onChange={(e) =>
                          setNewSession({ ...newSession, pot_contribution: parseInt(e.target.value) || 25 })
                        }
                        className="w-full px-3 py-2 bg-squid-black border border-squid-grey rounded-lg text-squid-light text-sm placeholder:text-squid-light/20 focus:outline-none focus:border-squid-gold"
                      />
                    </div>
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
              {allActiveSessions.length === 0 && (
                <p className="text-center text-squid-light/30 py-8 text-sm">
                  {activeSeason ? "No sessions yet. Create one to get started." : "Create a season first."}
                </p>
              )}
              {allActiveSessions
                .sort((a, b) => a.week_number - b.week_number)
                .map((session) => (
                <div
                  key={session.id}
                  className={`relative group p-3 rounded-xl border transition-all ${
                    selectedSession === session.id
                      ? "border-squid-pink bg-squid-pink/10"
                      : "border-squid-grey hover:border-squid-light/20"
                  } ${session.is_finale ? "border-squid-gold/50" : ""}`}
                >
                  <button
                    onClick={() => setSelectedSession(session.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-heading)] text-lg text-squid-light tracking-wider">
                          {session.is_finale ? "FINALE" : `WEEK ${session.week_number}`}
                        </span>
                        {session.is_finale && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-squid-gold/20 text-squid-gold">
                            ★
                          </span>
                        )}
                      </div>
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
                    <p className="text-xs text-squid-light/40 mt-1">
                      {session.title}
                      {!session.is_finale && (
                        <span className="text-squid-gold/60 ml-2">+${session.pot_contribution || 25}</span>
                      )}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: "session", id: session.id });
                    }}
                    className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 text-squid-red/50 hover:text-squid-red text-xs transition-all"
                  >
                    Delete
                  </button>
                </div>
              ))}
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
                      <span className="text-squid-green font-[family-name:var(--font-mono)] text-xs select-all">
                        trialbytokens.com/vote/{currentSession.slug || currentSession.id}
                      </span>
                    </p>
                    {!currentSession.is_finale && isCurrentSessionFromActiveSeason && (
                      <p className="text-squid-gold/60 text-xs mt-1">
                        Session contribution: ${currentSession.pot_contribution || 25} · Running total: ${runningPotTotal}
                      </p>
                    )}
                    {currentSession.is_finale && isCurrentSessionFromActiveSeason && (
                      <p className="text-squid-gold text-sm mt-1 font-[family-name:var(--font-heading)] tracking-wider">
                        SEASON FINALE · PRIZE POT: ${runningPotTotal}
                      </p>
                    )}
                  </div>

                  {currentSession.status !== "completed" && isCurrentSessionFromActiveSeason && (
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
                  {currentSession.is_finale ? "FINALISTS" : `PLAYERS (${participants.length}/4)`}
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
                          {(currentSession.status === "completed" || currentSession.status === "results") && (
                            <div className="mt-2">
                              {editingDemoUrl?.id === p.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    placeholder="Demo URL"
                                    value={editingDemoUrl.url}
                                    onChange={(e) =>
                                      setEditingDemoUrl({ ...editingDemoUrl, url: e.target.value })
                                    }
                                    className="flex-1 px-2 py-1 bg-squid-black border border-squid-grey rounded text-squid-light text-xs placeholder:text-squid-light/20 focus:outline-none focus:border-squid-green"
                                  />
                                  <button
                                    onClick={() => updateDemoUrl(p.id, editingDemoUrl.url)}
                                    disabled={actionLoading}
                                    className="px-2 py-1 bg-squid-green text-white rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingDemoUrl(null)}
                                    className="px-2 py-1 bg-squid-grey text-squid-light rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {p.demo_url ? (
                                    <a
                                      href={p.demo_url.match(/^https?:\/\//) ? p.demo_url : `https://${p.demo_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-squid-green hover:underline"
                                    >
                                      View Demo ↗
                                    </a>
                                  ) : (
                                    <span className="text-xs text-squid-light/30">No demo URL</span>
                                  )}
                                  <button
                                    onClick={() =>
                                      setEditingDemoUrl({ id: p.id, url: p.demo_url || "" })
                                    }
                                    className="text-xs text-squid-light/40 hover:text-squid-light"
                                  >
                                    {p.demo_url ? "Edit" : "Add"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {currentSession.status === "lobby" && !currentSession.is_finale && isCurrentSessionFromActiveSeason && (
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

                {currentSession.status === "lobby" && !currentSession.is_finale && isCurrentSessionFromActiveSeason && participants.length < 4 && (
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

      {/* Past Seasons Section */}
      {pastSeasons.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPastSeasons(!showPastSeasons)}
            className="flex items-center gap-3 mb-4 group"
          >
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-squid-light/40 tracking-wider group-hover:text-squid-light/60 transition-colors">
              PAST SEASONS ({pastSeasons.length})
            </h2>
            <motion.span
              animate={{ rotate: showPastSeasons ? 180 : 0 }}
              className="text-squid-light/40"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {showPastSeasons && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                {pastSeasons.map((season) => (
                  <div
                    key={season.id}
                    className="bg-squid-dark border border-squid-grey/50 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-[family-name:var(--font-heading)] text-xl text-squid-light/60 tracking-wider">
                            {season.name.toUpperCase()}
                          </h3>
                          {season.winner_name && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-squid-gold/20 text-squid-gold">
                              Winner: {season.winner_name}
                            </span>
                          )}
                          {season.total_prize_pot && (
                            <span className="text-xs text-squid-gold/60">
                              ${season.total_prize_pot} pot
                            </span>
                          )}
                        </div>
                        <p className="text-squid-light/30 text-xs mt-1">
                          {season.sessions.length} sessions · Closed
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete({ type: "season", id: season.id })}
                        className="text-squid-red/40 hover:text-squid-red text-xs transition-colors"
                      >
                        Delete Season
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {season.sessions
                        .sort((a, b) => a.week_number - b.week_number)
                        .map((s) => (
                        <div
                          key={s.id}
                          className={`relative group flex items-center justify-between p-2 rounded-lg border border-squid-grey/30 hover:border-squid-light/20 transition-all cursor-pointer ${
                            selectedSession === s.id ? "border-squid-pink/50 bg-squid-pink/5" : ""
                          }`}
                          onClick={() => setSelectedSession(s.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-[family-name:var(--font-heading)] text-sm text-squid-light/50 tracking-wider">
                              {s.is_finale ? "FINALE ★" : `WEEK ${s.week_number}`}
                            </span>
                            <span className="text-xs text-squid-light/30">{s.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-squid-light/30">
                              {s.participants.length} players
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({ type: "session", id: s.id });
                              }}
                              className="opacity-0 group-hover:opacity-100 text-squid-red/40 hover:text-squid-red text-xs transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
