"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useCallback, useEffect, useState } from "react";

interface MoneyPotAnimationProps {
  show: boolean;
  totalValue: number;
  previousValue?: number;
  onComplete?: () => void;
}

const BILL_COUNT = 12;

export default function MoneyPotAnimation({
  show,
  totalValue,
  previousValue = 0,
  onComplete,
}: MoneyPotAnimationProps) {
  const [displayValue, setDisplayValue] = useState(previousValue);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCoinSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, []);

  useEffect(() => {
    if (!show) {
      setDisplayValue(previousValue);
      return;
    }

    const duration = 2000;
    const startTime = Date.now();
    const startValue = previousValue;
    const endValue = totalValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(() => {
      animate();
      playCoinSound();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [show, totalValue, previousValue, playCoinSound]);

  const billVariants = {
    initial: (i: number) => ({
      x: (i % 2 === 0 ? -1 : 1) * (200 + Math.random() * 100),
      y: -100 - Math.random() * 150,
      rotate: Math.random() * 360,
      opacity: 0,
    }),
    animate: (i: number) => ({
      x: 0,
      y: 60,
      rotate: Math.random() * 30 - 15,
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 1.5,
        delay: 0.5 + i * 0.1,
        ease: "easeOut",
      },
    }),
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-[family-name:var(--font-heading)] text-2xl text-squid-gold mb-4 tracking-wider"
          >
            PRIZE POT
          </motion.h3>

          {/* Pot container */}
          <div className="relative w-48 h-48">
            {/* Flying bills */}
            {Array.from({ length: BILL_COUNT }).map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={billVariants}
                initial="initial"
                animate="animate"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="w-12 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-sm shadow-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-green-900">$</span>
                </div>
              </motion.div>
            ))}

            {/* Pot SVG */}
            <motion.svg
              viewBox="0 0 120 120"
              className="w-full h-full drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {/* Pot body */}
              <ellipse cx="60" cy="95" rx="40" ry="12" fill="#1a1a2e" />
              <path
                d="M20 50 L25 90 Q60 105 95 90 L100 50 Q60 35 20 50 Z"
                fill="url(#potGradient)"
                stroke="#FFD700"
                strokeWidth="2"
              />
              {/* Pot rim */}
              <ellipse cx="60" cy="50" rx="40" ry="12" fill="#FFD700" />
              <ellipse cx="60" cy="48" rx="35" ry="9" fill="#1a1a2e" />
              {/* Gold shimmer */}
              <ellipse cx="60" cy="50" rx="35" ry="10" fill="url(#goldShimmer)" opacity="0.5" />
              {/* Definitions */}
              <defs>
                <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
                <radialGradient id="goldShimmer" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                </radialGradient>
              </defs>
            </motion.svg>
          </div>

          {/* Value counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-center"
          >
            <div className="font-[family-name:var(--font-heading)] text-5xl text-squid-gold">
              ${displayValue.toLocaleString()}
            </div>
            <p className="text-squid-light/40 text-sm mt-1">Total Prize Pool</p>
          </motion.div>

          {/* Continue button */}
          {onComplete && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              onClick={onComplete}
              className="mt-6 px-6 py-2 bg-squid-gold/20 border border-squid-gold text-squid-gold rounded-full hover:bg-squid-gold hover:text-squid-black transition-all font-[family-name:var(--font-heading)] tracking-wider"
            >
              CONTINUE
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
