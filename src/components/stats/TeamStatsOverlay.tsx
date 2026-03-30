'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import { computePlayerStats } from '@/lib/utils';
import { CS2_MAPS } from '@/lib/constants';

interface TeamStatsOverlayProps {
  profileIds: string[];
  team: 'CT' | 'T';
}

export default function TeamStatsOverlay({ profileIds, team }: TeamStatsOverlayProps) {
  const { profiles } = useProfiles();
  const { drafts, matches } = useHistory();

  const teamMapStats = useMemo(() => {
    if (matches.length === 0) return [];

    const allStats = computePlayerStats(profiles, drafts, matches);
    const teamStats = allStats.filter((s) => profileIds.includes(s.profileId));

    // Aggregate wins and losses by map
    const byMap = new Map<string, { wins: number; losses: number }>();
    for (const stat of teamStats) {
      if (!byMap.has(stat.mapName)) {
        byMap.set(stat.mapName, { wins: 0, losses: 0 });
      }
      const m = byMap.get(stat.mapName)!;
      m.wins += stat.wins;
      m.losses += stat.losses;
    }

    return CS2_MAPS
      .filter((map) => byMap.has(map))
      .map((map) => {
        const s = byMap.get(map)!;
        return { map, wins: s.wins, losses: s.losses };
      });
  }, [profileIds, profiles, drafts, matches]);

  const isCT = team === 'CT';

  // Total across all maps
  const totalWins = teamMapStats.reduce((sum, s) => sum + s.wins, 0);
  const totalLosses = teamMapStats.reduce((sum, s) => sum + s.losses, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-2 mb-2 ${
        isCT ? 'border-sky-400/10 bg-sky-500/5' : 'border-amber-400/10 bg-amber-500/5'
      }`}
    >
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <p className="text-gray-500 font-rajdhani text-[10px] uppercase tracking-wider text-center">
          Team Record
        </p>
        <span className="font-orbitron text-[11px] font-bold">
          <span className="text-emerald-400">{totalWins}W</span>
          <span className="text-gray-600 mx-0.5">/</span>
          <span className="text-red-400">{totalLosses}L</span>
        </span>
      </div>
      {teamMapStats.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {teamMapStats.map((stat) => (
            <div
              key={stat.map}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[10px]"
            >
              <span className="text-gray-400 font-rajdhani">{stat.map}</span>
              <span className="font-orbitron font-bold text-emerald-400">{stat.wins}W</span>
              <span className="text-gray-600">/</span>
              <span className="font-orbitron font-bold text-red-400">{stat.losses}L</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
