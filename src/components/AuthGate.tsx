'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

const STORAGE_KEY = 'cs2picker_auth';
const PASS_HASH = '17b7c3e1';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === PASS_HASH) {
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (simpleHash(password) === PASS_HASH) {
      localStorage.setItem(STORAGE_KEY, PASS_HASH);
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  }, [password]);

  if (checking) return null;

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f13] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-orbitron font-bold text-[#8b9bb4] text-xl tracking-wider mb-2">
            CS2 TEAM PICKER
          </h1>
          <p className="text-gray-600 font-rajdhani text-sm">
            Enter password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            className={`
              w-full px-4 py-3 bg-white/[0.03] border rounded-md text-[#c8ccd4] font-rajdhani text-base
              placeholder:text-gray-600 focus:outline-none transition-all duration-200
              ${error
                ? 'border-red-500/40 focus:border-red-500/60'
                : 'border-white/[0.06] focus:border-[#8b9bb4]/40'
              }
            `}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400/80 text-sm font-rajdhani text-center"
            >
              Wrong password
            </motion.p>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full py-3 font-rajdhani font-bold uppercase tracking-wider text-sm
              bg-gradient-to-b from-[#3a7a3a] to-[#2d5e2d] border border-[#4a8a4a]/40 text-[#a8d8a8]
              rounded-md cursor-pointer transition-all duration-200
              hover:from-[#438a43] hover:to-[#356e35] hover:border-[#5a9a5a]/50
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Enter
          </button>
        </form>
      </motion.div>
    </div>
  );
}
