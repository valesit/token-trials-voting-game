"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface SoundControllerProps {
  isVoting: boolean;
  eliminatedPlayers?: { player_number: number; name: string }[];
  triggerElimination?: boolean;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function SoundController({
  isVoting,
  eliminatedPlayers = [],
  triggerElimination = false,
  enabled,
  onToggle,
}: SoundControllerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playDollSong = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    // Simplified "Mugunghwa" melody using oscillators
    const notes = [
      { freq: 392, dur: 0.4 }, // G4
      { freq: 330, dur: 0.4 }, // E4
      { freq: 330, dur: 0.4 }, // E4
      { freq: 0, dur: 0.2 },
      { freq: 392, dur: 0.4 }, // G4
      { freq: 330, dur: 0.4 }, // E4
      { freq: 330, dur: 0.4 }, // E4
      { freq: 0, dur: 0.2 },
      { freq: 392, dur: 0.3 }, // G4
      { freq: 440, dur: 0.3 }, // A4
      { freq: 392, dur: 0.3 }, // G4
      { freq: 330, dur: 0.3 }, // E4
      { freq: 294, dur: 0.6 }, // D4
      { freq: 0, dur: 0.3 },
      { freq: 294, dur: 0.3 }, // D4
      { freq: 330, dur: 0.3 }, // E4
      { freq: 392, dur: 0.6 }, // G4
    ];

    let time = ctx.currentTime;
    notes.forEach(({ freq, dur }) => {
      if (freq > 0) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.15, time);
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + dur - 0.05);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
      }
      time += dur;
    });
  }, [enabled, getAudioContext]);

  const speakElimination = useCallback(
    (playerNumber: number, playerName: string) => {
      if (!enabled || typeof window === "undefined") return;

      const utterance = new SpeechSynthesisUtterance(
        `Player ${playerNumber}. ${playerName}. Eliminated.`
      );
      utterance.rate = 0.7;
      utterance.pitch = 0.3;
      utterance.volume = 1;

      const voices = speechSynthesis.getVoices();
      const deepVoice = voices.find(
        (v) =>
          v.name.includes("Daniel") ||
          v.name.includes("Alex") ||
          v.name.includes("Google UK English Male")
      );
      if (deepVoice) utterance.voice = deepVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    },
    [enabled]
  );

  // Play doll song during voting (looped via interval)
  useEffect(() => {
    if (!isVoting || !enabled) return;
    playDollSong();
    const interval = setInterval(playDollSong, 5500);
    return () => clearInterval(interval);
  }, [isVoting, enabled, playDollSong]);

  // Announce eliminations
  useEffect(() => {
    if (!triggerElimination || !enabled || eliminatedPlayers.length === 0)
      return;

    eliminatedPlayers.forEach((p, i) => {
      setTimeout(() => {
        speakElimination(p.player_number, p.name);
      }, 1500 + i * 3000);
    });
  }, [triggerElimination, enabled, eliminatedPlayers, speakElimination]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch {}
      }
      speechSynthesis.cancel();
    };
  }, []);

  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm ${
        enabled
          ? "border-squid-green text-squid-green bg-squid-green/10"
          : "border-squid-grey text-squid-light/40"
      }`}
    >
      {enabled ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
        </svg>
      )}
      {isSpeaking ? "Speaking..." : enabled ? "Sound ON" : "Sound OFF"}
    </button>
  );
}
