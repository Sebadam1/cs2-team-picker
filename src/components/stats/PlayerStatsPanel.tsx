'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import { CS2_MAPS } from '@/lib/constants';
import { computePlayerStats } from '@/lib/utils';
import type { CS2Map } from '@/lib/types';
import GlowText from '../ui/GlowText';

type SortKey = 'name' | 'wins' | 'losses' | 'total' | 'winRate';
type SortDir = 'asc' | 'desc';

function SortHeader({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`font-orbitron text-xs cursor-pointer transition-colors select-none flex items-center gap-0.5 ${
        sortKey === 'name' ? 'justify-start' : 'justify-center'
      } ${isActive ? 'text-[#8b9bb4]' : 'text-gray-500 hover:text-gray-300'}`}
    >
      {label}
      {isActive && (
        <span className="text-[10px]">{currentDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  );
}

export default function PlayerStatsPanel() {
  const { profiles } = useProfiles();
  const { drafts, matches, loading } = useHistory();
  const [mapFilter, setMapFilter] = useState<CS2Map | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('winRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const allStats = useMemo(
    () => computePlayerStats(profiles, drafts, matches),
    [profiles, drafts, matches]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

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

    const rows = Array.from(byPlayer.values())
      .map((p) => ({ ...p, winRate: p.total > 0 ? Math.round((p.wins / p.total) * 100) : 0 }));

    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === 'name') {
        return dir * a.name.localeCompare(b.name);
      }
      const diff = (a[sortKey] - b[sortKey]) * dir;
      return diff !== 0 ? diff : b.total - a.total;
    });

    return rows;
  }, [allStats, mapFilter, sortKey, sortDir]);

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
          className={`px-3 py-1.5 rounded-md border text-xs font-rajdhani font-semibold transition-all cursor-pointer ${
            mapFilter === 'all'
              ? 'border-[#8b9bb4]/40 bg-[#8b9bb4]/10 text-[#8b9bb4]'
              : 'border-white/[0.06] text-gray-600 hover:border-white/[0.1]'
          }`}
        >
          All Maps
        </button>
        {CS2_MAPS.map((map) => (
          <button
            key={map}
            onClick={() => setMapFilter(map as CS2Map)}
            className={`px-3 py-1.5 rounded-md border text-xs font-rajdhani font-semibold transition-all cursor-pointer ${
              mapFilter === map
                ? 'border-[#8b9bb4]/40 bg-[#8b9bb4]/10 text-[#8b9bb4]'
                : 'border-white/[0.06] text-gray-600 hover:border-white/[0.1]'
            }`}
          >
            {map}
          </button>
        ))}
      </div>

      {playerSummary.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-lg">
          <p className="text-gray-500 font-rajdhani text-lg mb-2">No stats yet</p>
          <p className="text-gray-600 font-rajdhani text-sm">Record match results to see statistics</p>
        </div>
      ) : (
        <div className="border border-white/[0.06] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
            <SortHeader label="PLAYER" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="W" sortKey="wins" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="L" sortKey="losses" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="TOTAL" sortKey="total" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="WINRATE" sortKey="winRate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
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
                className="grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/[0.06] flex-shrink-0">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.06] flex items-center justify-center text-gray-600 text-[8px] font-bold">
                        {player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[#c8ccd4] font-rajdhani font-semibold text-sm truncate">{player.name}</span>
                </div>
                <span className="text-emerald-400/80 font-rajdhani font-bold text-sm text-center">{player.wins}</span>
                <span className="text-red-400/80 font-rajdhani font-bold text-sm text-center">{player.losses}</span>
                <span className="text-gray-400 font-rajdhani text-sm text-center">{player.total}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        player.winRate >= 50 ? 'bg-emerald-400/70' : 'bg-red-400/70'
                      }`}
                      style={{ width: `${player.winRate}%` }}
                    />
                  </div>
                  <span className={`font-orbitron text-xs font-bold w-10 text-right ${
                    player.winRate >= 50 ? 'text-emerald-400/80' : 'text-red-400/80'
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
