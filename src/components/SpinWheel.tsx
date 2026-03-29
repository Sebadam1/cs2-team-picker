'use client';

import { useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '@/context/GameContext';
import { useWheelAnimation } from '@/hooks/useWheelAnimation';
import { useSound } from '@/hooks/useSound';
import Button from './ui/Button';
import GlowText from './ui/GlowText';
import type { Player } from '@/lib/types';

function MiniTeamList({ players, team, max }: { players: Player[]; team: 'CT' | 'T'; max: number }) {
  const isCT = team === 'CT';
  return (
    <div className="flex-1 min-w-[160px]">
      <div className="text-center mb-2">
        <GlowText color={isCT ? 'ct' : 't'} as="h3" className="text-base">{team}</GlowText>
      </div>
      <div className="space-y-1.5">
        <AnimatePresence>
          {players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: isCT ? -30 : 30, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                isCT
                  ? 'bg-sky-500/10 border-sky-400/20'
                  : 'bg-amber-500/10 border-amber-400/20'
              }`}
            >
              <span className={`font-orbitron text-[10px] ${isCT ? 'text-sky-400' : 'text-amber-400'}`}>
                #{p.pickOrder}
              </span>
              <span className="text-white font-rajdhani font-semibold truncate">{p.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {Array.from({ length: max - players.length }).map((_, i) => (
          <div key={`empty-${team}-${i}`} className="px-3 py-1.5 border border-white/5 rounded-lg border-dashed">
            <span className="text-gray-700 font-rajdhani text-xs">---</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpinWheel() {
  const { state, dispatch } = useGame();
  const { playTick, playWinner, muted, setMuted } = useSound();
  const lastPickedRef = useRef<Player | null>(null);
  const showingResultRef = useRef(false);

  const onTick = useCallback(() => {
    playTick();
  }, [playTick]);

  const onComplete = useCallback((player: Player) => {
    playWinner();
    lastPickedRef.current = player;
    showingResultRef.current = true;

    setTimeout(() => {
      dispatch({ type: 'SPIN_COMPLETE', payload: { playerId: player.id } });
      showingResultRef.current = false;
    }, 1500);
  }, [dispatch, playWinner]);

  const { canvasRef, spin } = useWheelAnimation({
    players: state.availablePlayers,
    onTick,
    onComplete,
  });

  const handleSpin = useCallback(() => {
    if (state.isSpinning) return;
    const target = state.availablePlayers[Math.floor(Math.random() * state.availablePlayers.length)];
    dispatch({ type: 'START_SPIN' });
    spin(target);
  }, [state.isSpinning, state.availablePlayers, dispatch, spin]);

  const turnColor = state.currentTurn === 'CT' ? 'ct' : 't';
  const turnLabel = state.currentTurn === 'CT' ? 'COUNTER-TERRORISTS' : 'TERRORISTS';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4"
    >
      {/* Header */}
      <div className="text-center">
        <GlowText color={turnColor} className="text-xl md:text-2xl mb-1">
          {turnLabel} PICK
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-sm">
          Pick {state.pickNumber + 1} / 10
        </p>
      </div>

      {/* Wheel + Spin button */}
      <div className="flex flex-col items-center gap-3">
        <canvas
          ref={canvasRef}
          className="w-[280px] h-[280px] md:w-[350px] md:h-[350px]"
        />
        <Button
          variant={state.currentTurn === 'CT' ? 'ct' : 't'}
          size="lg"
          onClick={handleSpin}
          disabled={state.isSpinning || state.availablePlayers.length === 0}
        >
          {state.isSpinning ? 'Losuje se...' : 'SPIN!'}
        </Button>
        <button
          onClick={() => setMuted(!muted)}
          className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-rajdhani cursor-pointer"
        >
          {muted ? '🔇 Zvuk vypnutý' : '🔊 Zvuk zapnutý'}
        </button>
      </div>

      {/* Teams side by side below wheel */}
      <div className="w-full flex gap-4">
        <MiniTeamList players={state.teamCT} team="CT" max={5} />
        <div className="flex items-center">
          <span className="font-orbitron text-sm font-bold text-gray-600">VS</span>
        </div>
        <MiniTeamList players={state.teamT} team="T" max={5} />
      </div>
    </motion.div>
  );
}
