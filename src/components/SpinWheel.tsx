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
  const captain = players[0];
  const teamName = captain ? `${captain.name}'s` : (isCT ? 'Team A' : 'Team B');
  return (
    <div className="w-full lg:w-[200px] lg:min-w-[180px]">
      <div className="text-center mb-2">
        <GlowText color={isCT ? 'ct' : 't'} as="h3" className="text-sm truncate">{teamName}</GlowText>
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
  const { playTick, playWinner, playSwoosh, playProfileSound, muted, setMuted } = useSound();

  const onTick = useCallback(() => {
    playTick();
  }, [playTick]);

  const onComplete = useCallback((player: Player) => {
    if (player.soundUrl) {
      playProfileSound(player.soundUrl);
    } else {
      playWinner();
    }
    setTimeout(() => {
      dispatch({ type: 'SPIN_COMPLETE', payload: { playerId: player.id } });
    }, 1500);
  }, [dispatch, playWinner, playProfileSound]);

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
  const turnLabel = state.currentTurn === 'CT' ? 'TEAM A' : 'TEAM B';

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
          <Button
            variant={state.currentTurn === 'CT' ? 'ct' : 't'}
            size="lg"
            onClick={handleSpin}
            disabled={state.isSpinning || state.availablePlayers.length === 0}
          >
            {state.isSpinning ? 'Spinning...' : 'SPIN!'}
          </Button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMuted(!muted)}
              className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-rajdhani cursor-pointer"
            >
              {muted ? '🔇 Sound off' : '🔊 Sound on'}
            </button>
            {!state.isSpinning && state.availablePlayers.length > 0 && (
              <button
                onClick={() => dispatch({ type: 'SKIP_DRAFT' })}
                className="text-gray-600 hover:text-gray-400 transition-colors text-xs font-rajdhani cursor-pointer"
              >
                Skip remaining &raquo;
              </button>
            )}
          </div>

          {/* Remaining players list */}
          {!state.isSpinning && state.availablePlayers.length > 0 && (
            <div className="w-full max-w-[500px] mt-2">
              <p className="text-gray-500 font-orbitron text-[10px] uppercase tracking-wider text-center mb-2">
                Left to draw ({state.availablePlayers.length})
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {state.availablePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSegmentClick(p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center text-[7px] text-gray-500 font-bold">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-400 group-hover:text-white font-rajdhani font-semibold text-sm transition-colors">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
