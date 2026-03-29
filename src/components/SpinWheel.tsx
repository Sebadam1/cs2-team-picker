'use client';

import { useCallback } from 'react';
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
    <div className="w-full lg:w-[200px] lg:min-w-[180px]">
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
  const { playTick, playWinner, playSwoosh, muted, setMuted } = useSound();

  const onTick = useCallback(() => {
    playTick();
  }, [playTick]);

  const onComplete = useCallback((player: Player) => {
    playWinner();
    setTimeout(() => {
      dispatch({ type: 'SPIN_COMPLETE', payload: { playerId: player.id } });
    }, 1500);
  }, [dispatch, playWinner]);

  const onSegmentClick = useCallback((player: Player) => {
    if (state.isSpinning) return;
    playSwoosh();
    dispatch({ type: 'SPIN_COMPLETE', payload: { playerId: player.id } });
  }, [state.isSpinning, dispatch, playSwoosh]);

  const { canvasRef, spin } = useWheelAnimation({
    players: state.availablePlayers,
    onTick,
    onComplete,
    onSegmentClick,
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
      className="w-full max-w-5xl mx-auto flex flex-col items-center gap-4"
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

      {/* Desktop: CT left | Wheel center | T right */}
      {/* Mobile: Wheel, then CT, then T */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-6">
        {/* CT - hidden on mobile, shown on desktop left */}
        <div className="hidden lg:block">
          <MiniTeamList players={state.teamCT} team="CT" max={5} />
        </div>

        {/* Wheel + Spin button (center) */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <canvas
            ref={canvasRef}
            className="w-[280px] h-[280px] md:w-[350px] md:h-[350px] cursor-pointer"
          />
          <p className="text-gray-500 font-rajdhani text-xs">
            Click a segment to pick directly
          </p>
          <Button
            variant={state.currentTurn === 'CT' ? 'ct' : 't'}
            size="lg"
            onClick={handleSpin}
            disabled={state.isSpinning || state.availablePlayers.length === 0}
          >
            {state.isSpinning ? 'Spinning...' : 'SPIN!'}
          </Button>
          <button
            onClick={() => setMuted(!muted)}
            className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-rajdhani cursor-pointer"
          >
            {muted ? '🔇 Sound off' : '🔊 Sound on'}
          </button>
        </div>

        {/* T - hidden on mobile, shown on desktop right */}
        <div className="hidden lg:block">
          <MiniTeamList players={state.teamT} team="T" max={5} />
        </div>
      </div>

      {/* Mobile: Teams below wheel */}
      <div className="w-full flex flex-col gap-4 lg:hidden">
        <MiniTeamList players={state.teamCT} team="CT" max={5} />
        <MiniTeamList players={state.teamT} team="T" max={5} />
      </div>
    </motion.div>
  );
}
