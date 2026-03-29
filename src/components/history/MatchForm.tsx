'use client';

import { useState, useCallback } from 'react';
import { useHistory } from '@/context/HistoryContext';
import { CS2_MAPS } from '@/lib/constants';
import type { CS2Map, TeamSide } from '@/lib/types';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';

interface MatchFormProps {
  draftId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function MatchForm({ draftId, onComplete, onCancel }: MatchFormProps) {
  const { saveMatch } = useHistory();
  const [mapName, setMapName] = useState<CS2Map>('Mirage');
  const [winningTeam, setWinningTeam] = useState<TeamSide>('CT');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await saveMatch({
        draftId,
        mapName,
        winningTeam,
        screenshot: screenshot || undefined,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save match');
    } finally {
      setSaving(false);
    }
  }, [draftId, mapName, winningTeam, screenshot, saveMatch, onComplete]);

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
                  ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/5'
                }
              `}
            >
              {map}
            </button>
          ))}
        </div>
      </div>

      {/* Winner selector */}
      <div>
        <label className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">Winner</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setWinningTeam('CT')}
            className={`
              flex-1 px-4 py-3 rounded-xl border-2 font-orbitron font-bold transition-all cursor-pointer
              ${winningTeam === 'CT'
                ? 'border-sky-400/60 bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(79,195,247,0.2)]'
                : 'border-white/10 bg-white/[0.02] text-gray-500 hover:border-white/20'
              }
            `}
          >
            CT
          </button>
          <button
            type="button"
            onClick={() => setWinningTeam('T')}
            className={`
              flex-1 px-4 py-3 rounded-xl border-2 font-orbitron font-bold transition-all cursor-pointer
              ${winningTeam === 'T'
                ? 'border-amber-400/60 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(255,179,0,0.2)]'
                : 'border-white/10 bg-white/[0.02] text-gray-500 hover:border-white/20'
              }
            `}
          >
            T
          </button>
        </div>
      </div>

      {/* Screenshot upload */}
      <FileUpload
        accept="image/*"
        label="Scoreboard Screenshot (optional)"
        hint="Upload a screenshot of the final scoreboard"
        onFileSelect={setScreenshot}
        previewType="image"
      />

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
          className="font-rajdhani font-bold uppercase tracking-wider border rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500/20 border-emerald-400/50 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(0,230,118,0.3)] px-3 py-1.5 text-sm"
        >
          {saving ? 'Saving...' : 'Save Match Result'}
        </button>
      </div>
    </form>
  );
}
