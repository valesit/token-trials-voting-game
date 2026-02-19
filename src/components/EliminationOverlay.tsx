"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Participant } from "@/lib/types";

interface EliminationOverlayProps {
  show: boolean;
  eliminated: Participant[];
  survivors: Participant[];
  onComplete?: () => void;
}

export default function EliminationOverlay({
  show,
  eliminated,
  survivors,
  onComplete,
}: EliminationOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-squid-black/95"
        >
          {/* Red flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-squid-red pointer-events-none"
          />

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-5xl md:text-7xl text-squid-pink glitch-text mb-12"
          >
            ELIMINATED
          </motion.h1>

          {/* Eliminated players */}
          <div className="flex gap-8 mb-12">
            {eliminated.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: 1 + i * 0.5, duration: 0.8, type: "spring" }}
                className="text-center"
              >
                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-squid-pink mx-auto mb-4 grayscale">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-squid-darker text-4xl font-[family-name:var(--font-heading)] text-squid-grey">
                      {p.player_number}
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, scale: 3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.5, duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-7xl md:text-8xl font-[family-name:var(--font-heading)] text-squid-pink drop-shadow-[0_0_30px_rgba(255,40,126,0.8)]">
                      X
                    </span>
                  </motion.div>
                </div>
                <p className="font-[family-name:var(--font-heading)] text-2xl text-squid-pink tracking-wider">
                  Player {p.player_number}
                </p>
                <p className="text-squid-light/60">{p.name}</p>
              </motion.div>
            ))}
          </div>

          {/* Survivors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.5 }}
            className="text-center"
          >
            <h2 className="font-[family-name:var(--font-heading)] text-3xl text-squid-green mb-6 tracking-wider">
              QUALIFIED FOR FINALS
            </h2>
            <div className="flex gap-6">
              {survivors.map((p) => (
                <div key={p.id} className="text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-squid-green shadow-[0_0_30px_rgba(3,196,161,0.4)] mx-auto mb-2">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-squid-darker text-3xl font-[family-name:var(--font-heading)] text-squid-green">
                        {p.player_number}
                      </div>
                    )}
                  </div>
                  <p className="font-[family-name:var(--font-heading)] text-xl text-squid-green">
                    Player {p.player_number}
                  </p>
                  <p className="text-sm text-squid-light/60">{p.name}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
            onClick={onComplete}
            className="mt-10 px-8 py-3 bg-squid-grey border border-squid-light/20 rounded-full text-squid-light hover:bg-squid-pink hover:border-squid-pink transition-all font-[family-name:var(--font-heading)] text-xl tracking-wider"
          >
            CONTINUE
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
