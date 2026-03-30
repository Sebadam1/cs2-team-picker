'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import type { Draft } from '@/lib/types';
import DraftDetail from './DraftDetail';
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
      className="p-4 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/5 hover:border-white/20 cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-rajdhani text-sm">{dateStr} {timeStr}</span>
          <span className={`text-xs font-orbitron px-2 py-0.5 rounded ${
            draft.animationType === 'case'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20'
          }`}>
            {draft.animationType === 'case' ? '📦 Case' : '🎡 Wheel'}
          </span>
          {match && (
            <span className={`text-xs font-orbitron px-2 py-0.5 rounded ${
              match.winningTeam === 'CT'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-400/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-400/20'
            }`}>
              {match.mapName} - {match.winningTeam === 'CT' ? ctCaptainName : tCaptainName} won
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-sky-400 font-orbitron text-xs">{ctCaptainName}&apos;s: </span>
          <span className="text-gray-400 font-rajdhani">{ctNames}</span>
        </div>
        <div>
          <span className="text-amber-400 font-orbitron text-xs">{tCaptainName}&apos;s: </span>
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
  const { drafts, loading, error } = useHistory();
  const { profiles } = useProfiles();
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  const profileNames = new Map(profiles.map((p) => [p.id, p.name]));

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
      <div className="mb-6">
        <GlowText color="green" as="h2" className="text-2xl mb-1">
          DRAFT HISTORY
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-sm">{drafts.length} drafts recorded</p>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
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
