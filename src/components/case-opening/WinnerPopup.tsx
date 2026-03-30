'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Player, TeamSide } from '@/lib/types';
import GlowText from '../ui/GlowText';

interface WinnerPopupProps {
  player: Player | null;
  team: TeamSide;
  isVisible: boolean;
  onDismiss: () => void;
}

export default function WinnerPopup({ player, team, isVisible, onDismiss }: WinnerPopupProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isVisible || !player) return;

    // Auto-dismiss after 3 seconds
    timeoutRef.current = setTimeout(onDismiss, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible, player, onDismiss]);

  const isCT = team === 'CT';
  const teamColor = isCT ? 'ct' : 't';
  const borderColor = isCT ? 'border-sky-400' : 'border-amber-400';
  const glowColor = isCT
    ? 'shadow-[0_0_40px_rgba(79,195,247,0.5),0_0_80px_rgba(79,195,247,0.2)]'
    : 'shadow-[0_0_40px_rgba(255,179,0,0.5),0_0_80px_rgba(255,179,0,0.2)]';

  return (
    <AnimatePresence>
      {isVisible && player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onDismiss}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
            className="relative flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                }}
                animate={{
                  opacity: 0,
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: 0,
                  rotate: Math.random() * 720,
                }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: Math.random() * 0.3 }}
                className={`absolute w-2 h-2 rounded-full ${
                  isCT ? 'bg-sky-400' : 'bg-amber-400'
                }`}
                style={{ top: '50%', left: '50%' }}
              />
            ))}

            {/* Photo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1, duration: 0.5, bounce: 0.4 }}
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 ${borderColor} ${glowColor}`}
            >
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <span className="font-orbitron text-4xl font-bold text-gray-400">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <GlowText color={teamColor} as="h2" className="text-3xl md:text-4xl mb-2">
                {player.name}
              </GlowText>
              <p className="text-gray-400 font-rajdhani text-lg">
                joins <span className={`font-orbitron font-bold ${isCT ? 'text-sky-400' : 'text-amber-400'}`}>{isCT ? 'Team A' : 'Team B'}</span>!
              </p>
            </motion.div>
          </motion.div>

          <audio ref={audioRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
