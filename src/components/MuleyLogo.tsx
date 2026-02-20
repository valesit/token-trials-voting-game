"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface MuleyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  variant?: "default" | "squid"; // default = MuleSoft blue, squid = pink/green theme
}

const sizes = { sm: 48, md: 80, lg: 120 };

/**
 * MuleSoft-style logo (cloud + lightning) with optional Muley animation.
 * Styled for MuleSoft SEs - use variant "squid" to match Squid Game theme.
 */
export default function MuleyLogo({
  className = "",
  size = "md",
  animated = true,
  variant = "squid",
}: MuleyLogoProps) {
  const px = sizes[size];
  const isSquid = variant === "squid";
  const primary = isSquid ? "#FF287E" : "#00A2E4";
  const secondary = isSquid ? "#00B5E2" : "#0070D2";

  const content = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MuleSoft Muley"
    >
      {/* Cloud - overlapping circles for a soft MuleSoft-style cloud */}
      <ellipse cx="50" cy="52" rx="28" ry="22" fill={primary} />
      <ellipse cx="35" cy="55" rx="16" ry="14" fill={primary} />
      <ellipse cx="65" cy="55" rx="16" ry="14" fill={primary} />
      {/* Lightning bolt - MuleSoft accent */}
      <motion.path
        d="M54 18 L36 48 L46 48 L32 82 L52 50 L42 50 Z"
        fill={secondary}
        initial={animated ? { opacity: 0.85 } : undefined}
        animate={
          animated
            ? { opacity: [0.85, 1, 0.85] }
            : undefined
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
    </svg>
  );

  return (
    <motion.div
      className="inline-flex items-center justify-center"
      initial={animated ? { y: 0 } : undefined}
      animate={
        animated
          ? {
              y: [0, -4, 0],
            }
          : undefined
      }
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {content}
    </motion.div>
  );
}

/** Platform pink - same as Squid Game accent */
const PINK = "#FF287E";
/** Muley blue */
const BLUE = "#00B5E2";

/**
 * Official Muley logo image (circle + M) - blue version
 */
export function MuleyLogoImage({
  size = 80,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative inline-flex shrink-0 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: size, height: size }}
    >
      <Image
        src="/muley-logo.png"
        alt="Muley - MuleSoft"
        width={size}
        height={size}
        className="object-contain drop-shadow-[0_0_12px_rgba(255,40,126,0.4)]"
        priority
      />
    </motion.div>
  );
}

/**
 * Muley logo (circle + M) as SVG - use for pink or any color to match the platform
 */
export function MuleyLogoSvg({
  size = 80,
  color = PINK,
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const isPink = color === PINK;
  const shadow = isPink
    ? "drop-shadow-[0_0_12px_rgba(255,40,126,0.5)]"
    : "drop-shadow-[0_0_12px_rgba(0,181,226,0.4)]";

  return (
    <motion.div
      className={`relative inline-flex shrink-0 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${shadow}`}
        aria-label="Muley - MuleSoft"
      >
        {/* Circle */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="6"
        />
        {/* Stylized M - bold block letter, wide strokes */}
        <path
          d="M22 22v56h14V45l12 33h10l12-33v33h14V22H78l-14 38L50 22H22z"
          fill={color}
        />
      </svg>
    </motion.div>
  );
}

/**
 * Pink version of the Muley logo (circle + M) to match platform/Squid Game theme
 */
export function MuleyLogoPink({
  size = 80,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <MuleyLogoSvg size={size} color={PINK} className={className} />;
}

/**
 * "For MuleSoft Engineers" badge with small logo
 */
export function MuleyBadge({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-squid-grey bg-squid-dark/80 ${className}`}
    >
      <MuleyLogoImage size={32} />
      <span className="text-xs text-squid-light/60 tracking-wider uppercase font-[family-name:var(--font-heading)]">
        For MuleSoft SEs
      </span>
    </motion.div>
  );
}
