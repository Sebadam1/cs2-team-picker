'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import type { Draft, PlayerProfile } from '@/lib/types';
import MatchForm from './MatchForm';
import MatchDetail from './MatchDetail';
import Button from '../ui/Button';
import GlowText from '../ui/GlowText';
import Modal from '../ui/Modal';

interface DraftDetailProps {
  draft: Draft;
  onBack: () => void;
}

function TeamPickList({ picks, profiles, team }: {
  picks: { profileId: string; pickOrder: number }[];
  profiles: Map<string, PlayerProfile>;
  team: 'CT' | 'T';
}) {
  const isCT = team === 'CT';
  const sorted = [...picks].sort((a, b) => a.pickOrder - b.pickOrder);

  return (
    <div className="flex-1">
      <GlowText color={isCT ? 'ct' : 't'} as="h3" className="text-lg mb-3 text-center">
        {team}
      </GlowText>
      <div className="space-y-2">
        {sorted.map((pick) => {
          const profile = profiles.get(pick.profileId);
          return (
            <motion.div
              key={pick.profileId}
              initial={{ opacity: 0, x: isCT ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                isCT
                  ? 'bg-sky-500/10 border-sky-400/20'
                  : 'bg-amber-500/10 border-amber-400/20'
              }`}
            >
              {/* Photo */}
              <div className={`w-8 h-8 rounded-full overflow-hidden border flex-shrink-0 ${
                isCT ? 'border-sky-400/40' : 'border-amber-400/40'
              }`}>
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {(profile?.name || '?').charAt(0)}
                  </div>
                )}
              </div>

              <span className={`font-orbitron text-[10px] ${isCT ? 'text-sky-400' : 'text-amber-400'}`}>
                #{pick.pickOrder}
              </span>
              <span className="text-white font-rajdhani font-semibold truncate">
                {profile?.name || 'Unknown'}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function DraftDetail({ draft, onBack }: DraftDetailProps) {
  const { profiles } = useProfiles();
  const { getMatchForDraft, deleteDraft, deleteMatch } = useHistory();
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(false);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const match = getMatchForDraft(draft.id);

  const date = new Date(draft.date);
  const dateStr = date.toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const handleDeleteDraft = async () => {
    setDeleting(true);
    try {
      await deleteDraft(draft.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete draft:', err);
    } finally {
      setDeleting(false);
      setConfirmDeleteDraft(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!match) return;
    setDeleting(true);
    try {
      await deleteMatch(match.id);
    } catch (err) {
      console.error('Failed to delete match:', err);
    } finally {
      setDeleting(false);
      setConfirmDeleteMatch(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-300 font-rajdhani text-sm flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to History
        </button>
        <button
          onClick={() => setConfirmDeleteDraft(true)}
          className="text-red-500/60 hover:text-red-400 font-rajdhani text-sm cursor-pointer transition-colors"
        >
          Delete Draft
        </button>
      </div>

      <div className="mb-6">
        <GlowText color="green" as="h2" className="text-2xl mb-1">
          DRAFT DETAIL
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-sm">{dateStr}</p>
        <span className={`text-xs font-orbitron px-2 py-0.5 rounded inline-block mt-2 ${
          draft.animationType === 'case'
            ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20'
        }`}>
          {draft.animationType === 'case' ? '📦 Case Opening' : '🎡 Spin Wheel'}
        </span>
      </div>

      {/* Teams */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <TeamPickList picks={draft.teamCT} profiles={profileMap} team="CT" />
        <div className="hidden md:flex items-center">
          <span className="text-gray-600 font-orbitron text-2xl">VS</span>
        </div>
        <TeamPickList picks={draft.teamT} profiles={profileMap} team="T" />
      </div>

      {/* Match result */}
      {match ? (
        <div>
          <MatchDetail match={match} />
          <div className="text-center mt-3">
            <button
              onClick={() => setConfirmDeleteMatch(true)}
              className="text-red-500/50 hover:text-red-400 font-rajdhani text-xs cursor-pointer transition-colors"
            >
              Delete Match Result
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-500 font-rajdhani mb-3">No match result recorded</p>
          <Button variant="primary" size="md" onClick={() => setShowMatchForm(true)}>
            Record Match Result
          </Button>
        </div>
      )}

      <Modal isOpen={showMatchForm} onClose={() => setShowMatchForm(false)} title="Record Match Result">
        <MatchForm
          draftId={draft.id}
          onComplete={() => setShowMatchForm(false)}
          onCancel={() => setShowMatchForm(false)}
        />
      </Modal>

      {/* Confirm delete draft */}
      <Modal isOpen={confirmDeleteDraft} onClose={() => setConfirmDeleteDraft(false)} title="Delete Draft">
        <div className="text-center py-4">
          <p className="text-gray-300 font-rajdhani mb-2">
            Are you sure you want to delete this draft?
          </p>
          {match && (
            <p className="text-amber-400/80 font-rajdhani text-sm mb-4">
              This will also delete the associated match result.
            </p>
          )}
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteDraft(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteDraft} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete match */}
      <Modal isOpen={confirmDeleteMatch} onClose={() => setConfirmDeleteMatch(false)} title="Delete Match Result">
        <div className="text-center py-4">
          <p className="text-gray-300 font-rajdhani mb-4">
            Are you sure you want to delete this match result?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteMatch(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteMatch} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
