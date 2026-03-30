'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import type { Draft } from '@/lib/types';
import DraftDetail from './DraftDetail';
import Button from '../ui/Button';
import GlowText from '../ui/GlowText';

function DraftRow({ draft, onSelect, profileNames }: {
  draft: Draft;
  onSelect: () => void;
  profileNames: Map<string, string>;
}) {
  const { getMatchForDraft } = useHistory();
  const match = getMatchForDraft(draft.id);

  const ctSorted = [...draft.teamCT].sort((a, b) => a.pickOrder - b.pickOrder);
  const tSorted = [...draft.teamT].sort((a, b) => a.pickOrder - b.pickOrder);
  const ctCaptainName = profileNames.get(ctSorted[0]?.profileId) || '???';
  const tCaptainName = profileNames.get(tSorted[0]?.profileId) || '???';
  const ctNames = ctSorted.map((p) => profileNames.get(p.profileId) || '???').join(', ');
  const tNames = tSorted.map((p) => profileNames.get(p.profileId) || '???').join(', ');

  const date = new Date(draft.date);
  const dateStr = date.toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      className="p-4 border border-white/[0.06] rounded-lg bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.1] cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-rajdhani text-sm">{dateStr} {timeStr}</span>
          <span className={`text-xs font-orbitron px-2 py-0.5 rounded ${
            draft.animationType === 'case'
              ? 'bg-[#c49a6c]/10 text-[#d4a86a] border border-[#c49a6c]/15'
              : 'bg-[#8b9bb4]/10 text-[#8b9bb4] border border-[#8b9bb4]/15'
          }`}>
            {draft.animationType === 'case' ? '📦 Case' : '🎡 Wheel'}
          </span>
          {match && (
            <span className={`text-xs font-orbitron px-2 py-0.5 rounded ${
              match.winningTeam === 'CT'
                ? 'bg-[#6b8fc2]/10 text-[#8bafd4] border border-[#6b8fc2]/15'
                : 'bg-[#c49a6c]/10 text-[#d4a86a] border border-[#c49a6c]/15'
            }`}>
              {match.mapName} - {match.winningTeam === 'CT' ? ctCaptainName : tCaptainName} won
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-[#8bafd4] font-orbitron text-xs">{ctCaptainName}&apos;s: </span>
          <span className="text-gray-400 font-rajdhani">{ctNames}</span>
        </div>
        <div>
          <span className="text-[#d4a86a] font-orbitron text-xs">{tCaptainName}&apos;s: </span>
          <span className="text-gray-400 font-rajdhani">{tNames}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface DraftHistoryProps {
  onNavigateToDraft?: () => void;
}

export default function DraftHistory({ onNavigateToDraft }: DraftHistoryProps) {
  const { drafts, matches, loading, error } = useHistory();
  const { profiles } = useProfiles();
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  const profileNames = new Map(profiles.map((p) => [p.id, p.name]));

  const handleExportCSV = useCallback(() => {
    // Only export drafts that have a match result
    const rows: string[][] = [];
    rows.push([
      'Date',
      'Map',
      'Winner',
      'Team A Captain',
      'Team A Player 2',
      'Team A Player 3',
      'Team A Player 4',
      'Team A Player 5',
      'Team B Captain',
      'Team B Player 2',
      'Team B Player 3',
      'Team B Player 4',
      'Team B Player 5',
    ]);

    for (const draft of drafts) {
      const match = matches.find((m) => m.draftId === draft.id);
      if (!match) continue;

      const ctSorted = [...draft.teamCT].sort((a, b) => a.pickOrder - b.pickOrder);
      const tSorted = [...draft.teamT].sort((a, b) => a.pickOrder - b.pickOrder);

      const ctNames = ctSorted.map((p) => profileNames.get(p.profileId) || '???');
      const tNames = tSorted.map((p) => profileNames.get(p.profileId) || '???');

      // Pad to 5 if needed
      while (ctNames.length < 5) ctNames.push('');
      while (tNames.length < 5) tNames.push('');

      const ctCaptain = ctNames[0];
      const tCaptain = tNames[0];
      const winnerLabel = match.winningTeam === 'CT' ? `${ctCaptain}'s Team` : `${tCaptain}'s Team`;

      const date = new Date(match.playedAt).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      rows.push([
        date,
        match.mapName,
        winnerLabel,
        ...ctNames,
        ...tNames,
      ]);
    }

    const csvContent = rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cs2-matches-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [drafts, matches, profileNames]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-rajdhani">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-rajdhani mb-4">{error}</p>
      </div>
    );
  }

  if (selectedDraft) {
    return (
      <DraftDetail
        draft={selectedDraft}
        onBack={() => setSelectedDraft(null)}
        onNavigateToDraft={onNavigateToDraft}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <GlowText color="green" as="h2" className="text-2xl mb-1">
            DRAFT HISTORY
          </GlowText>
          <p className="text-gray-400 font-rajdhani text-sm">{drafts.length} drafts recorded</p>
        </div>
        {matches.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleExportCSV}>
            📥 Export CSV
          </Button>
        )}
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-lg">
          <p className="text-gray-500 font-rajdhani text-lg mb-2">No drafts yet</p>
          <p className="text-gray-600 font-rajdhani text-sm">Completed drafts will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {drafts.map((draft) => (
              <DraftRow
                key={draft.id}
                draft={draft}
                onSelect={() => setSelectedDraft(draft)}
                profileNames={profileNames}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
