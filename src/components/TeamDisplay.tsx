'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '@/context/GameContext';
import { useHistory } from '@/context/HistoryContext';
import { useSound } from '@/hooks/useSound';
import TeamColumn from './TeamColumn';
import TeamStatsOverlay from './stats/TeamStatsOverlay';
import MatchForm from './history/MatchForm';
import Button from './ui/Button';
import GlowText from './ui/GlowText';
import Modal from './ui/Modal';
import type { TeamSide } from '@/lib/types';

export default function TeamDisplay() {
  const { state, dispatch } = useGame();
  const { saveDraft } = useHistory();
  const { playSwoosh } = useSound();
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [locking, setLocking] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { team: TeamSide } | undefined;
    const overData = over.data.current as { team?: TeamSide; sortable?: { containerId: string } } | undefined;

    if (!activeData) return;

    const activeTeam = activeData.team;

    let overTeam: TeamSide;
    if (over.id === 'team-CT') {
      overTeam = 'CT';
    } else if (over.id === 'team-T') {
      overTeam = 'T';
    } else if (overData?.team) {
      overTeam = overData.team;
    } else {
      return;
    }

    if (activeTeam === overTeam) {
      const teamPlayers = overTeam === 'CT' ? state.teamCT : state.teamT;
      const oldIndex = teamPlayers.findIndex((p) => p.id === active.id);
      const newIndex = teamPlayers.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(teamPlayers, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_TEAM',
          payload: { team: overTeam, playerIds: newOrder.map((p) => p.id) },
        });
        playSwoosh();
      }
    } else {
      const overPlayerInTarget = overTeam === 'CT'
        ? state.teamCT.find((p) => p.id === over.id)
        : state.teamT.find((p) => p.id === over.id);

      if (overPlayerInTarget) {
        dispatch({
          type: 'SWAP_PLAYERS',
          payload: { playerA: active.id as string, playerB: overPlayerInTarget.id },
        });
      } else {
        const targetTeam = overTeam === 'CT' ? state.teamCT : state.teamT;
        if (targetTeam.length > 0) {
          dispatch({
            type: 'SWAP_PLAYERS',
            payload: { playerA: active.id as string, playerB: targetTeam[targetTeam.length - 1].id },
          });
        }
      }
      playSwoosh();
    }
  }, [state.teamCT, state.teamT, dispatch, playSwoosh]);

  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };

  const handleLockTeams = async () => {
    const hasProfiles = state.teamCT.some((p) => p.profileId);
    if (!hasProfiles) return;

    setLocking(true);
    try {
      // Save current team composition at time of lock (index = order)
      const teamCT = state.teamCT.map((p, i) => ({
        profileId: p.profileId!,
        pickOrder: i + 1,
      }));
      const teamT = state.teamT.map((p, i) => ({
        profileId: p.profileId!,
        pickOrder: i + 1,
      }));

      const draftId = await saveDraft({
        animationType: state.animationType,
        teamCT,
        teamT,
      });

      dispatch({ type: 'SET_DRAFT_ID', payload: draftId });
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setLocking(false);
    }
  };

  const ctProfileIds = state.teamCT.filter((p) => p.profileId).map((p) => p.profileId!);
  const tProfileIds = state.teamT.filter((p) => p.profileId).map((p) => p.profileId!);
  const hasProfiles = ctProfileIds.length > 0;
  const isLocked = !!state.draftId;

  // Dynamic team names for the header
  const ctCaptain = state.teamCT[0];
  const tCaptain = state.teamT[0];
  const ctTeamName = ctCaptain ? `${ctCaptain.name}'s Team` : 'Team 1';
  const tTeamName = tCaptain ? `${tCaptain.name}'s Team` : 'Team 2';

  // Find selected player name for the toast
  const selectedPlayer = state.selectedForSwap
    ? [...state.teamCT, ...state.teamT].find((p) => p.id === state.selectedForSwap)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="text-center mb-6">
        <GlowText color="green" className="text-2xl md:text-3xl mb-2">
          {isLocked ? 'TEAMS LOCKED' : 'TEAMS DRAFTED'}
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-sm">
          {isLocked
            ? `${ctTeamName} vs ${tTeamName}`
            : 'Drag players to reorder or click to swap between teams'
          }
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            {hasProfiles && <TeamStatsOverlay profileIds={ctProfileIds} team="CT" />}
            <TeamColumn team="CT" players={state.teamCT} />
          </div>

          <div className="flex md:flex-col items-center justify-center gap-2 py-2">
            <div className="w-12 h-[1px] md:w-[1px] md:h-12 bg-white/10" />
            <span className="font-orbitron text-xl font-bold text-gray-500">VS</span>
            <div className="w-12 h-[1px] md:w-[1px] md:h-12 bg-white/10" />
          </div>

          <div className="flex-1">
            {hasProfiles && <TeamStatsOverlay profileIds={tProfileIds} team="T" />}
            <TeamColumn team="T" players={state.teamT} />
          </div>
        </div>
      </DndContext>

      <div className="flex justify-center gap-3 mt-6">
        {hasProfiles && !isLocked && (
          <Button variant="primary" size="md" onClick={handleLockTeams} disabled={locking}>
            {locking ? 'Saving...' : '🔒 Lock Teams'}
          </Button>
        )}

        {isLocked && (
          <Button variant="primary" size="md" onClick={() => setShowMatchForm(true)}>
            Record Match Result
          </Button>
        )}

        <Button variant="danger" size="md" onClick={handleReset}>
          New Draft
        </Button>
      </div>

      {/* Fixed bottom toast for swap selection */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border border-white/15 bg-[#1a1a2e]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            <span className="text-white font-rajdhani font-semibold">
              {selectedPlayer.name}
            </span>
            <span className="text-gray-400 font-rajdhani text-sm">
              selected — click a player from the other team to swap
            </span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_SWAP_SELECTION' })}
              className="ml-2 text-gray-500 hover:text-white transition-colors text-lg cursor-pointer leading-none"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Form Modal */}
      {state.draftId && (
        <Modal isOpen={showMatchForm} onClose={() => setShowMatchForm(false)} title="Record Match Result">
          <MatchForm
            draftId={state.draftId}
            onComplete={() => setShowMatchForm(false)}
            onCancel={() => setShowMatchForm(false)}
            ctTeamName={ctTeamName}
            tTeamName={tTeamName}
          />
        </Modal>
      )}
    </motion.div>
  );
}
