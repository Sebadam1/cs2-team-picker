'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import { CS2_MAPS } from '@/lib/constants';
import { computePlayerStats } from '@/lib/utils';
import type { CS2Map } from '@/lib/types';
import GlowText from '../ui/GlowText';

export default function PlayerStatsPanel() {
  const { profiles } = useProfiles();
  const { drafts, matches, loading } = useHistory();
  const [mapFilter, setMapFilter] = useState<CS2Map | 'all'>('all');

  const allStats = useMemo(
    () => computePlayerStats(profiles, drafts, matches),
    [profiles, drafts, matches]
  );

  // Aggregate stats per player (across maps or filtered by map)
  const playerSummary = useMemo(() => {
    const filtered = mapFilter === 'all' ? allStats : allStats.filter((s) => s.mapName === mapFilter);

    const byPlayer = new Map<string, { profileId: string; name: string; wins: number; losses: number; total: number }>();

    for (const stat of filtered) {
      const key = stat.profileId;
      if (!byPlayer.has(key)) {
        byPlayer.set(key, { profileId: stat.profileId, name: stat.profileName, wins: 0, losses: 0, total: 0 });
      }
      const p = byPlayer.get(key)!;
      p.wins += stat.wins;
      p.losses += stat.losses;
      p.total += stat.totalGames;
    }

    return Array.from(byPlayer.values())
      .map((p) => ({ ...p, winRate: p.total > 0 ? Math.round((p.wins / p.total) * 100) : 0 }))
      .sort((a, b) => b.winRate - a.winRate || b.total - a.total);
  }, [allStats, mapFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-rajdhani">Loading stats...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <GlowText color="green" as="h2" className="text-2xl mb-1">
          PLAYER STATISTICS
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-sm">{matches.length} matches recorded</p>
      </div>

      {/* Map filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setMapFilter('all')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-rajdhani font-semibold transition-all cursor-pointer ${
            mapFilter === 'all'
              ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 text-gray-500 hover:border-white/20'
          }`}
        >
          All Maps
        </button>
        {CS2_MAPS.map((map) => (
          <button
            key={map}
            onClick={() => setMapFilter(map as CS2Map)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-rajdhani font-semibold transition-all cursor-pointer ${
              mapFilter === map
                ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-400'
                : 'border-white/10 text-gray-500 hover:border-white/20'
            }`}
          >
            {map}
          </button>
        ))}
      </div>

      {playerSummary.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-500 font-rajdhani text-lg mb-2">No stats yet</p>
          <p className="text-gray-600 font-rajdhani text-sm">Record match results to see statistics</p>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-gray-400 font-orbitron text-xs">PLAYER</span>
            <span className="text-gray-400 font-orbitron text-xs text-center">W</span>
            <span className="text-gray-400 font-orbitron text-xs text-center">L</span>
            <span className="text-gray-400 font-orbitron text-xs text-center">TOTAL</span>
            <span className="text-gray-400 font-orbitron text-xs text-center">WINRATE</span>
          </div>

          {/* Rows */}
          {playerSummary.map((player, i) => {
            const profile = profiles.find((p) => p.id === player.profileId);
            return (
              <motion.div
                key={player.profileId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-gray-500 text-[8px] font-bold">
                        {player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-white font-rajdhani font-semibold text-sm truncate">{player.name}</span>
                </div>
                <span className="text-emerald-400 font-rajdhani font-bold text-sm text-center">{player.wins}</span>
                <span className="text-red-400 font-rajdhani font-bold text-sm text-center">{player.losses}</span>
                <span className="text-gray-400 font-rajdhani text-sm text-center">{player.total}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        player.winRate >= 50 ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${player.winRate}%` }}
                    />
                  </div>
                  <span className={`font-orbitron text-xs font-bold w-10 text-right ${
                    player.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {player.winRate}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
