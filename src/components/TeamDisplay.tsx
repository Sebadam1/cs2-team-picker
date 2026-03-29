'use client';

import { useCallback } from 'react';
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
import { motion } from 'motion/react';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import TeamColumn from './TeamColumn';
import Button from './ui/Button';
import GlowText from './ui/GlowText';
import type { TeamSide } from '@/lib/types';

export default function TeamDisplay() {
  const { state, dispatch } = useGame();
  const { playSwoosh } = useSound();

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

    // Determine target team
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
      // Reorder within same team
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
      // Cross-team: find who is at the drop position and swap
      const overPlayerInTarget = overTeam === 'CT'
        ? state.teamCT.find((p) => p.id === over.id)
        : state.teamT.find((p) => p.id === over.id);

      if (overPlayerInTarget) {
        dispatch({
          type: 'SWAP_PLAYERS',
          payload: { playerA: active.id as string, playerB: overPlayerInTarget.id },
        });
      } else {
        // Dropping on empty team area - move (swap with last member)
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="text-center mb-6">
        <GlowText color="green" className="text-2xl md:text-3xl mb-2">
          TÝMY VYLOSOVÁNY
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-sm">
          Přetahuj hráče pro přeřazení nebo klikni pro swap
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <TeamColumn team="CT" players={state.teamCT} />

          {/* VS divider */}
          <div className="flex md:flex-col items-center justify-center gap-2 py-2">
            <div className="w-12 h-[1px] md:w-[1px] md:h-12 bg-white/10" />
            <span className="font-orbitron text-xl font-bold text-gray-500">VS</span>
            <div className="w-12 h-[1px] md:w-[1px] md:h-12 bg-white/10" />
          </div>

          <TeamColumn team="T" players={state.teamT} />
        </div>
      </DndContext>

      {state.selectedForSwap && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <p className="text-gray-400 font-rajdhani text-sm">
            Hráč vybrán - klikni na hráče z druhého týmu pro swap
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'CLEAR_SWAP_SELECTION' })}
            className="mt-2"
          >
            Zrušit výběr
          </Button>
        </motion.div>
      )}

      <div className="flex justify-center gap-3 mt-6">
        <Button variant="danger" size="md" onClick={handleReset}>
          Nové losování
        </Button>
      </div>
    </motion.div>
  );
}
