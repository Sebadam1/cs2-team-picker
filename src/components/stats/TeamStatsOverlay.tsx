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

    // Aggregate by map
    const byMap = new Map<string, { wins: number; losses: number; total: number }>();
    for (const stat of teamStats) {
      if (!byMap.has(stat.mapName)) {
        byMap.set(stat.mapName, { wins: 0, losses: 0, total: 0 });
      }
      const m = byMap.get(stat.mapName)!;
      m.wins += stat.wins;
      m.losses += stat.losses;
      m.total += stat.totalGames;
    }

    return CS2_MAPS
      .filter((map) => byMap.has(map))
      .map((map) => {
        const s = byMap.get(map)!;
        // Average winrate across players (divide by num players with stats on this map)
        const playerCount = teamStats.filter((st) => st.mapName === map).length;
        const avgWinRate = playerCount > 0 ? Math.round((s.wins / s.total) * 100) : 0;
        return { map, ...s, winRate: avgWinRate };
      });
  }, [profileIds, profiles, drafts, matches]);

  if (teamMapStats.length === 0) return null;

  const isCT = team === 'CT';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-2 mb-2 ${
        isCT ? 'border-sky-400/10 bg-sky-500/5' : 'border-amber-400/10 bg-amber-500/5'
      }`}
    >
      <p className="text-gray-500 font-rajdhani text-[10px] uppercase tracking-wider mb-1.5 text-center">
        Team Map Stats
      </p>
      <div className="flex flex-wrap gap-1 justify-center">
        {teamMapStats.map((stat) => (
          <div
            key={stat.map}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[10px]"
          >
            <span className="text-gray-400 font-rajdhani">{stat.map}</span>
            <span className={`font-orbitron font-bold ${
              stat.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {stat.winRate}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
