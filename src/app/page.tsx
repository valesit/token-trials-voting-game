"use client";

import { motion } from "framer-motion";
import { EnhancedFloatingShapes } from "@/components/SquidShapes";
import { MuleyLogoImage, MuleyBadge } from "@/components/MuleyLogo";
import SquidDoll from "@/components/SquidDoll";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@/lib/types";

export default function Home() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  useEffect(() => {
    async function fetchActive() {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .in("status", ["lobby", "voting", "results"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setActiveSession(data);
    }
    fetchActive();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Red Light / Green Light ambient glow effect */}
      <div className="fixed inset-0 red-green-light pointer-events-none z-0" />

      <EnhancedFloatingShapes />

      {/* Scanline effect */}
      <div className="scanlines fixed inset-0 pointer-events-none z-10" />

      <div className="relative z-20 text-center px-6">
        {/* Muley logo (official) + Squid Game shapes */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 md:gap-8 mb-6"
        >
          <div className="w-10 h-10 rounded-full border-3 border-squid-pink shrink-0" />
          <svg viewBox="0 0 100 100" className="w-10 h-10 shrink-0">
            <polygon
              points="50,5 95,95 5,95"
              fill="none"
              stroke="#FF287E"
              strokeWidth="6"
            />
          </svg>
          <MuleyLogoImage size={100} className="shrink-0" />
          <svg viewBox="0 0 100 100" className="w-10 h-10 shrink-0">
            <polygon
              points="50,5 95,95 5,95"
              fill="none"
              stroke="#FF287E"
              strokeWidth="6"
            />
          </svg>
          <div className="w-10 h-10 border-3 border-squid-pink shrink-0" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="font-[family-name:var(--font-heading)] text-6xl md:text-8xl lg:text-9xl text-squid-pink glitch-text mb-4 leading-none"
        >
          MULEY SE AI
          <br />
          SQUID GAMES
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-squid-light/60 text-lg md:text-xl mb-2 tracking-widest uppercase"
        >
          Presented by
        </motion.p>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl text-squid-green mb-4 tracking-wider"
        >
          HOW WE AI
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-10"
        >
          <MuleyBadge />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-squid-light/50 max-w-lg mx-auto mb-12 text-base"
        >
          4 SE&apos;s enter. 2 survive. Vote for the best AI demo each session.
          The top demos advance to the end of quarter final.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {activeSession && (
            <Link
              href={`/vote/${activeSession.id}`}
              className="px-8 py-4 bg-squid-pink text-white font-[family-name:var(--font-heading)] text-2xl tracking-wider rounded-xl hover:bg-squid-pink-dark transition-all pulse-glow"
            >
              {activeSession.status === "voting"
                ? "VOTE NOW"
                : "JOIN SESSION"}
            </Link>
          )}

          <Link
            href="/leaderboard"
            className="px-8 py-4 border-2 border-squid-green text-squid-green font-[family-name:var(--font-heading)] text-2xl tracking-wider rounded-xl hover:bg-squid-green hover:text-squid-black transition-all"
          >
            LEADERBOARD
          </Link>

          <Link
            href="/host"
            className="px-6 py-3 border border-squid-grey text-squid-light/40 text-sm rounded-xl hover:border-squid-light/40 hover:text-squid-light/60 transition-all"
          >
            Admin
          </Link>
        </motion.div>
      </div>

      {/* Squid Game doll - bottom right */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20">
        <SquidDoll />
      </div>

      {/* Bottom decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-squid-pink to-transparent"
      />
    </div>
  );
}
