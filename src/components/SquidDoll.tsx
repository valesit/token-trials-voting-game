"use client";

import { motion } from "framer-motion";

/**
 * Stylized "Red Light, Green Light"–inspired doll for the home page.
 * Generic game-doll silhouette in Squid Game theme colors (pink, blue, dark).
 */
export default function SquidDoll({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className={`relative inline-flex flex-col items-center ${className}`}
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Doll body - dress */}
        <svg
          viewBox="0 0 120 180"
          className="w-32 md:w-40 h-auto drop-shadow-[0_0_20px_rgba(255,40,126,0.3)]"
          aria-hidden
        >
          {/* Dress - trapezoid dress shape */}
          <path
            d="M20 75 L60 180 L100 75 L60 95 Z"
            fill="#1a1a2e"
            stroke="#FF287E"
            strokeWidth="2"
          />
          {/* Collar / neckline */}
          <ellipse cx="60" cy="75" rx="42" ry="8" fill="#0f0f1a" stroke="#FF287E" strokeWidth="1.5" />
          {/* Head - round */}
          <circle
            cx="60"
            cy="45"
            r="28"
            fill="#2a2a3e"
            stroke="#FF287E"
            strokeWidth="2"
          />
          {/* Face - simple eyes (two dots) */}
          <circle cx="52" cy="42" r="3" fill="#00B5E2" />
          <circle cx="68" cy="42" r="3" fill="#00B5E2" />
          {/* Bow / hair accent - Squid Game doll style */}
          <path
            d="M35 35 Q30 25 38 28 Q42 38 35 35"
            fill="none"
            stroke="#FF287E"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M85 35 Q90 25 82 28 Q78 38 85 35"
            fill="none"
            stroke="#FF287E"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-2 text-xs text-squid-light/40 font-[family-name:var(--font-heading)] tracking-widest uppercase"
      >
        Red light, green light
      </motion.p>
    </motion.div>
  );
}
