'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import type { Match } from '@/lib/types';
import GlowText from '../ui/GlowText';

interface MatchDetailProps {
  match: Match;
}

export default function MatchDetail({ match }: MatchDetailProps) {
  const [showFullScreenshot, setShowFullScreenshot] = useState(false);
  const { drafts } = useHistory();
  const { profiles } = useProfiles();
  const isCT = match.winningTeam === 'CT';

  // Resolve winning team captain name
  let winnerLabel: string = isCT ? 'Team A' : 'Team B';
  const draft = drafts.find((d) => d.id === match.draftId);
  if (draft) {
    const winningPicks = match.winningTeam === 'CT' ? draft.teamCT : draft.teamT;
    const sorted = [...winningPicks].sort((a, b) => a.pickOrder - b.pickOrder);
    const captain = profiles.find((p) => p.id === sorted[0]?.profileId);
    if (captain) winnerLabel = `${captain.name}'s Team`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/[0.06] rounded-lg p-4 bg-white/[0.015]"
    >
      <GlowText color={isCT ? 'ct' : 't'} as="h3" className="text-base mb-3">
        MATCH RESULT
      </GlowText>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-rajdhani text-sm">Map:</span>
          <span className="text-[#c8ccd4] font-orbitron text-sm font-bold">{match.mapName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-rajdhani text-sm">Winner:</span>
          <span className={`font-orbitron text-sm font-bold ${
            isCT ? 'text-[#8bafd4]' : 'text-[#d4a86a]'
          }`}>
            {winnerLabel}
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
            className="w-full rounded-lg border border-white/[0.06] cursor-pointer hover:border-white/[0.1] transition-all"
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
