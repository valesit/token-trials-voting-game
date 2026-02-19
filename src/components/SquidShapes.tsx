"use client";

import { motion } from "framer-motion";

export function SquidCircle({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-full border-4 border-squid-pink ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function SquidTriangle({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`${className}`}
      animate={{ rotate: -360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon
          points="50,5 95,95 5,95"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-squid-pink"
        />
      </svg>
    </motion.div>
  );
}

export function SquidSquare({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`border-4 border-squid-pink ${className}`}
      animate={{ rotate: 45 }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-15 z-0">
      <SquidCircle className="absolute top-[10%] left-[5%] w-24 h-24" />
      <SquidTriangle className="absolute top-[20%] right-[10%] w-20 h-20" />
      <SquidSquare className="absolute bottom-[15%] left-[15%] w-16 h-16" />
      <SquidCircle className="absolute bottom-[25%] right-[20%] w-32 h-32" />
      <SquidTriangle className="absolute top-[60%] left-[40%] w-12 h-12" />
      <SquidSquare className="absolute top-[5%] left-[60%] w-20 h-20" />
    </div>
  );
}
