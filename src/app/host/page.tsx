"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FloatingShapes } from "@/components/SquidShapes";
import MuleyLogo from "@/components/MuleyLogo";

export default function HostLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/host/dashboard");
    } else {
      setError("Access denied. Invalid credentials.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <FloatingShapes />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-md px-6"
      >
        <div className="bg-squid-dark border border-squid-grey rounded-2xl p-8">
          <div className="flex justify-center gap-4 items-center mb-6">
            <MuleyLogo size="md" animated variant="squid" />
            <div className="w-12 h-12 rounded-full border-4 border-squid-pink flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-6 h-6">
                <polygon
                  points="50,15 85,85 15,85"
                  fill="none"
                  stroke="#FF287E"
                  strokeWidth="6"
                />
              </svg>
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-heading)] text-4xl text-center text-squid-pink mb-2 tracking-wider">
            FRONT MAN ACCESS
          </h1>
          <p className="text-center text-squid-light/40 mb-8 text-sm">
            Authorized personnel only
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access code"
                className="w-full px-4 py-3 bg-squid-darker border border-squid-grey rounded-xl text-squid-light placeholder:text-squid-light/20 focus:outline-none focus:border-squid-pink transition-colors font-[family-name:var(--font-mono)]"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-squid-red text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-squid-pink text-white font-[family-name:var(--font-heading)] text-xl tracking-wider rounded-xl hover:bg-squid-pink-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "VERIFYING..." : "ENTER"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
