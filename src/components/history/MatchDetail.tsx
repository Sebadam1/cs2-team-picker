'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { Match } from '@/lib/types';
import GlowText from '../ui/GlowText';

interface MatchDetailProps {
  match: Match;
}

export default function MatchDetail({ match }: MatchDetailProps) {
  const [showFullScreenshot, setShowFullScreenshot] = useState(false);
  const isCT = match.winningTeam === 'CT';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 rounded-xl p-4 bg-white/[0.02]"
    >
      <GlowText color={isCT ? 'ct' : 't'} as="h3" className="text-base mb-3">
        MATCH RESULT
      </GlowText>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-rajdhani text-sm">Map:</span>
          <span className="text-white font-orbitron text-sm font-bold">{match.mapName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-rajdhani text-sm">Winner:</span>
          <span className={`font-orbitron text-sm font-bold ${
            isCT ? 'text-sky-400' : 'text-amber-400'
          }`}>
            {match.winningTeam}
          </span>
        </div>
        <span className="text-gray-500 font-rajdhani text-xs">
          {new Date(match.playedAt).toLocaleDateString('cs-CZ')}
        </span>
      </div>

      {match.screenshotUrl && (
        <>
          <img
            src={match.screenshotUrl}
            alt="Scoreboard"
            className="w-full rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-all"
            onClick={() => setShowFullScreenshot(true)}
          />
          {showFullScreenshot && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
              onClick={() => setShowFullScreenshot(false)}
            >
              <img
                src={match.screenshotUrl}
                alt="Scoreboard"
                className="max-w-full max-h-full rounded-lg"
              />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
