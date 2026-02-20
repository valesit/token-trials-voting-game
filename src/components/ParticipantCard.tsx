"use client";

import { motion } from "framer-motion";
import { Participant } from "@/lib/types";

interface ParticipantCardProps {
  participant: Participant;
  onClick?: () => void;
  selected?: boolean;
  showVotes?: boolean;
  revealMode?: boolean;
  disabled?: boolean;
}

export default function ParticipantCard({
  participant,
  onClick,
  selected = false,
  showVotes = false,
  revealMode = false,
  disabled = false,
}: ParticipantCardProps) {
  const isEliminated = participant.status === "eliminated";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: isEliminated && revealMode ? "grayscale(100%) brightness(0.5)" : "none",
      }}
      transition={{ duration: 0.5 }}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative overflow-hidden rounded-2xl border-2 transition-all
        ${disabled ? "cursor-default" : "cursor-pointer"}
        ${selected
          ? "border-squid-green shadow-[0_0_30px_rgba(0,181,226,0.5)]"
          : "border-squid-grey hover:border-squid-pink"
        }
        ${isEliminated && revealMode ? "opacity-60" : ""}
        bg-squid-dark
      `}
    >
      {/* Player number badge */}
      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-squid-teal flex items-center justify-center">
        <span className="font-[family-name:var(--font-heading)] text-xl text-white">
          {participant.player_number}
        </span>
      </div>

      {/* Image */}
      <div className="aspect-square relative bg-squid-darker">
        {participant.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={participant.image_url}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-[family-name:var(--font-heading)] text-squid-grey">
            {participant.player_number}
          </div>
        )}

        {/* Eliminated X overlay */}
        {isEliminated && revealMode && (
          <motion.div
            initial={{ opacity: 0, scale: 3, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-[8rem] font-[family-name:var(--font-heading)] text-squid-pink drop-shadow-[0_0_20px_rgba(255,40,126,0.8)]">
              X
            </span>
          </motion.div>
        )}

        {/* Selected checkmark */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-squid-green flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-[family-name:var(--font-heading)] text-2xl text-white tracking-wider">
          {participant.name}
        </h3>
        {participant.topic && (
          <p className="text-sm text-squid-light/60 mt-1 line-clamp-2">
            {participant.topic}
          </p>
        )}
        {participant.demo_url && (
          <a
            href={participant.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-2 text-sm text-squid-green hover:text-squid-green/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Demo
          </a>
        )}
        {showVotes && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-[family-name:var(--font-mono)] text-squid-green text-lg">
              {participant.vote_count}
            </span>
            <span className="text-xs text-squid-light/40">votes</span>
          </div>
        )}
      </div>

      {/* Status badge */}
      {revealMode && (
        <div
          className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
            isEliminated
              ? "bg-squid-pink/20 text-squid-pink"
              : "bg-squid-green/20 text-squid-green"
          }`}
        >
          {isEliminated ? "ELIMINATED" : "ALIVE"}
        </div>
      )}
    </motion.div>
  );
}
