"use client";

import { motion } from "framer-motion";

interface ShapeProps {
  className?: string;
  delay?: number;
  pulse?: boolean;
}

export function SquidCircle({ className = "", delay = 0, pulse = false }: ShapeProps) {
  return (
    <motion.div
      className={`rounded-full border-4 border-squid-pink ${pulse ? "shape-pulse" : ""} ${className}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1, rotate: 360 }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        rotate: { duration: 20, repeat: Infinity, ease: "linear", delay },
      }}
    />
  );
}

export function SquidTriangle({ className = "", delay = 0, pulse = false }: ShapeProps) {
  return (
    <motion.div
      className={`${pulse ? "shape-pulse" : ""} ${className}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1, rotate: -360 }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        rotate: { duration: 25, repeat: Infinity, ease: "linear", delay },
      }}
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

export function SquidSquare({ className = "", delay = 0, pulse = false }: ShapeProps) {
  return (
    <motion.div
      className={`border-4 border-squid-pink ${pulse ? "shape-pulse" : ""} ${className}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1, rotate: 45 }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        rotate: { duration: 15, repeat: Infinity, ease: "linear", delay },
      }}
    />
  );
}

export function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Larger shapes with staggered entrance animations */}
      <SquidCircle className="absolute top-[8%] left-[3%] w-40 h-40 opacity-20" delay={0.1} pulse />
      <SquidTriangle className="absolute top-[15%] right-[8%] w-36 h-36 opacity-20" delay={0.2} pulse />
      <SquidSquare className="absolute bottom-[12%] left-[10%] w-32 h-32 opacity-20" delay={0.3} pulse />
      <SquidCircle className="absolute bottom-[20%] right-[15%] w-48 h-48 opacity-15" delay={0.4} pulse />
      <SquidTriangle className="absolute top-[55%] left-[35%] w-24 h-24 opacity-15" delay={0.5} />
      <SquidSquare className="absolute top-[3%] left-[55%] w-28 h-28 opacity-20" delay={0.6} pulse />
      {/* Additional shapes for more visual interest */}
      <SquidCircle className="absolute top-[40%] right-[3%] w-20 h-20 opacity-15" delay={0.7} />
      <SquidTriangle className="absolute bottom-[35%] left-[2%] w-16 h-16 opacity-15" delay={0.8} />
      <SquidSquare className="absolute top-[70%] right-[40%] w-14 h-14 opacity-10" delay={0.9} />
    </div>
  );
}

export function EnhancedFloatingShapes() {
  return (
    <>
      <FloatingShapes />
      {/* Extra large background shapes with glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full border-8 border-squid-pink/10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, rotate: 360 }}
          transition={{ opacity: { duration: 1 }, rotate: { duration: 60, repeat: Infinity, ease: "linear" } }}
        />
        <motion.div
          className="absolute -bottom-16 -right-16 w-72 h-72 border-8 border-squid-teal/10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, rotate: -45 }}
          transition={{ opacity: { duration: 1, delay: 0.3 }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
        />
      </div>
    </>
  );
}
