'use client';

import { useState, useCallback } from 'react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import { CS2_MAPS } from '@/lib/constants';
import type { CS2Map, MatchOutcome, Match } from '@/lib/types';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';

interface PlayerStatInput {
  profileId: string;
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
}

interface MatchFormProps {
  draftId: string;
  onComplete: () => void;
  onCancel: () => void;
  ctTeamName?: string;
  tTeamName?: string;
  editMatch?: Match;
}

export default function MatchForm({ draftId, onComplete, onCancel, ctTeamName, tTeamName, editMatch }: MatchFormProps) {
  const { saveMatch, updateMatch, savePlayerMatchStats, drafts, getPlayerStatsForMatch } = useHistory();
  const { profiles } = useProfiles();
  const [mapName, setMapName] = useState<CS2Map>(editMatch?.mapName || 'Mirage');
  const [winningTeam, setWinningTeam] = useState<MatchOutcome>(editMatch?.winningTeam || 'CT');
  const [scoreCT, setScoreCT] = useState<string>(editMatch?.scoreCT?.toString() ?? '');
  const [scoreT, setScoreT] = useState<string>(editMatch?.scoreT?.toString() ?? '');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlayerStats, setShowPlayerStats] = useState(false);

  // Build player stat inputs from draft
  const draft = drafts.find((d) => d.id === draftId);
  const existingStats = editMatch ? getPlayerStatsForMatch(editMatch.id) : [];

  const [playerStats, setPlayerStats] = useState<PlayerStatInput[]>(() => {
    if (!draft) return [];
    const allPicks = [...draft.teamCT, ...draft.teamT];
    return allPicks.map((pick) => {
      const profile = profiles.find((p) => p.id === pick.profileId);
      const existing = existingStats.find((s) => s.profileId === pick.profileId);
      return {
        profileId: pick.profileId,
        name: profile?.name || 'Unknown',
        kills: existing?.kills ?? 0,
        deaths: existing?.deaths ?? 0,
        assists: existing?.assists ?? 0,
        damage: existing?.damage ?? 0,
      };
    });
  });

  // Resolve team names from draft if not provided as props
  let ctLabel = ctTeamName || 'Team A';
  let tLabel = tTeamName || 'Team B';
  if (!ctTeamName || !tTeamName) {
    if (draft) {
      const ctSorted = [...draft.teamCT].sort((a, b) => a.pickOrder - b.pickOrder);
      const tSorted = [...draft.teamT].sort((a, b) => a.pickOrder - b.pickOrder);
      const ctCaptain = profiles.find((p) => p.id === ctSorted[0]?.profileId);
      const tCaptain = profiles.find((p) => p.id === tSorted[0]?.profileId);
      if (!ctTeamName && ctCaptain) ctLabel = `${ctCaptain.name}'s`;
      if (!tTeamName && tCaptain) tLabel = `${tCaptain.name}'s`;
    }
  }

  const updatePlayerStat = (index: number, field: keyof Omit<PlayerStatInput, 'profileId' | 'name'>, value: string) => {
    setPlayerStats((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: parseInt(value) || 0 };
      return next;
    });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const parsedScoreCT = scoreCT !== '' ? parseInt(scoreCT) : undefined;
      const parsedScoreT = scoreT !== '' ? parseInt(scoreT) : undefined;

      let matchId: string;

      if (editMatch) {
        await updateMatch(editMatch.id, {
          mapName,
          winningTeam,
          scoreCT: parsedScoreCT ?? null,
          scoreT: parsedScoreT ?? null,
        });
        matchId = editMatch.id;
      } else {
        const match = await saveMatch({
          draftId,
          mapName,
          winningTeam,
          scoreCT: parsedScoreCT,
          scoreT: parsedScoreT,
          screenshot: screenshot || undefined,
        });
        matchId = match.id;
      }

      // Save player stats if any were entered
      const hasAnyStats = playerStats.some((s) => s.kills > 0 || s.deaths > 0 || s.assists > 0 || s.damage > 0);
      if (hasAnyStats) {
        await savePlayerMatchStats(
          playerStats.map((s) => ({
            matchId,
            profileId: s.profileId,
            kills: s.kills,
            deaths: s.deaths,
            assists: s.assists,
            damage: s.damage,
          }))
        );
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save match');
    } finally {
      setSaving(false);
    }
  }, [draftId, mapName, winningTeam, scoreCT, scoreT, screenshot, playerStats, saveMatch, updateMatch, savePlayerMatchStats, editMatch, onComplete]);

  // Identify which players are CT vs T
  const ctProfileIds = new Set(draft?.teamCT.map((p) => p.profileId) || []);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Map selector */}
      <div>
        <label className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">Map</label>
        <div className="grid grid-cols-4 gap-2">
          {CS2_MAPS.map((map) => (
            <button
              key={map}
              type="button"
              onClick={() => setMapName(map as CS2Map)}
              className={`
                px-3 py-2 rounded-lg border text-sm font-rajdhani font-semibold transition-all cursor-pointer
                ${mapName === map
                  ? 'border-[#8b9bb4]/40 bg-[#8b9bb4]/10 text-[#8b9bb4]'
                  : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/[0.1] hover:bg-white/[0.04]'
                }
              `}
            >
              {map}
            </button>
          ))}
        </div>
      </div>

      {/* Score inputs */}
      <div>
        <label className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">Score (optional)</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-orbitron text-[#8bafd4] mb-1">{ctLabel}</label>
            <input
              type="number"
              min="0"
              max="99"
              value={scoreCT}
              onChange={(e) => setScoreCT(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white font-orbitron text-center text-lg focus:border-[#6b8fc2]/40 focus:outline-none transition-colors"
            />
          </div>
          <span className="text-gray-600 font-orbitron text-lg pt-5">:</span>
          <div className="flex-1">
            <label className="block text-xs font-orbitron text-[#d4a86a] mb-1">{tLabel}</label>
            <input
              type="number"
              min="0"
              max="99"
              value={scoreT}
              onChange={(e) => setScoreT(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white font-orbitron text-center text-lg focus:border-[#c49a6c]/40 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Winner selector */}
      <div>
        <label className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">Winner</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWinningTeam('CT')}
            className={`
              flex-1 px-4 py-3 rounded-xl border-2 font-orbitron font-bold text-sm transition-all cursor-pointer
              ${winningTeam === 'CT'
                ? 'border-[#6b8fc2]/40 bg-[#6b8fc2]/10 text-[#8bafd4]'
                : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/[0.1]'
              }
            `}
          >
            {ctLabel}
          </button>
          <button
            type="button"
            onClick={() => setWinningTeam('draw')}
            className={`
              px-4 py-3 rounded-xl border-2 font-orbitron font-bold text-sm transition-all cursor-pointer
              ${winningTeam === 'draw'
                ? 'border-[#8b9bb4]/40 bg-[#8b9bb4]/10 text-[#8b9bb4]'
                : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/[0.1]'
              }
            `}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setWinningTeam('T')}
            className={`
              flex-1 px-4 py-3 rounded-xl border-2 font-orbitron font-bold text-sm transition-all cursor-pointer
              ${winningTeam === 'T'
                ? 'border-[#c49a6c]/40 bg-[#c49a6c]/10 text-[#d4a86a]'
                : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/[0.1]'
              }
            `}
          >
            {tLabel}
          </button>
        </div>
      </div>

      {/* Screenshot upload (only for new matches) */}
      {!editMatch && (
        <FileUpload
          accept="image/*"
          label="Scoreboard Screenshot (optional)"
          hint="Upload a screenshot of the final scoreboard"
          onFileSelect={setScreenshot}
          previewType="image"
        />
      )}

      {/* Player Stats Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowPlayerStats(!showPlayerStats)}
          className="text-sm font-rajdhani font-semibold text-gray-400 hover:text-gray-300 cursor-pointer transition-colors flex items-center gap-1"
        >
          {showPlayerStats ? '▼' : '▶'} Player Stats (K/D/A/DMG)
        </button>
      </div>

      {/* Player Stats Inputs */}
      {showPlayerStats && playerStats.length > 0 && (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_52px_52px_52px_64px] gap-1.5 px-1 text-[10px] font-orbitron text-gray-500">
            <span>Player</span>
            <span className="text-center">K</span>
            <span className="text-center">D</span>
            <span className="text-center">A</span>
            <span className="text-center">DMG</span>
          </div>
          {playerStats.map((stat, i) => {
            const isCT = ctProfileIds.has(stat.profileId);
            return (
              <div
                key={stat.profileId}
                className={`grid grid-cols-[1fr_52px_52px_52px_64px] gap-1.5 items-center px-1 py-1 rounded ${
                  isCT ? 'bg-[#6b8fc2]/[0.04]' : 'bg-[#c49a6c]/[0.04]'
                }`}
              >
                <span className={`text-xs font-rajdhani font-semibold truncate ${
                  isCT ? 'text-[#8bafd4]' : 'text-[#d4a86a]'
                }`}>
                  {stat.name}
                </span>
                <input
                  type="number"
                  min="0"
                  value={stat.kills || ''}
                  onChange={(e) => updatePlayerStat(i, 'kills', e.target.value)}
                  placeholder="0"
                  className="w-full px-1 py-1 rounded border border-white/[0.06] bg-white/[0.02] text-white font-rajdhani text-xs text-center focus:border-white/[0.15] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={stat.deaths || ''}
                  onChange={(e) => updatePlayerStat(i, 'deaths', e.target.value)}
                  placeholder="0"
                  className="w-full px-1 py-1 rounded border border-white/[0.06] bg-white/[0.02] text-white font-rajdhani text-xs text-center focus:border-white/[0.15] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={stat.assists || ''}
                  onChange={(e) => updatePlayerStat(i, 'assists', e.target.value)}
                  placeholder="0"
                  className="w-full px-1 py-1 rounded border border-white/[0.06] bg-white/[0.02] text-white font-rajdhani text-xs text-center focus:border-white/[0.15] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={stat.damage || ''}
                  onChange={(e) => updatePlayerStat(i, 'damage', e.target.value)}
                  placeholder="0"
                  className="w-full px-1 py-1 rounded border border-white/[0.06] bg-white/[0.02] text-white font-rajdhani text-xs text-center focus:border-white/[0.15] focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm font-rajdhani">{error}</p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <button
          type="submit"
          disabled={saving}
          className="font-rajdhani font-bold uppercase tracking-wider border rounded-md transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-b from-[#3a7a3a] to-[#2d5e2d] border-[#4a8a4a]/40 text-[#a8d8a8] hover:from-[#438a43] hover:to-[#356e35] hover:border-[#5a9a5a]/50 px-3 py-1.5 text-sm"
        >
          {saving ? 'Saving...' : (editMatch ? 'Update Match' : 'Save Match Result')}
        </button>
      </div>
    </form>
  );
}
