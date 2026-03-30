'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { shuffleArray } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import Button from './ui/Button';
import GlowText from './ui/GlowText';
import WinnerPopup from './case-opening/WinnerPopup';
import type { Player } from '@/lib/types';

const ITEM_WIDTH = 140;
const ITEM_GAP = 4;
const ITEM_TOTAL = ITEM_WIDTH + ITEM_GAP;
const VISIBLE_ITEMS = 40;
const WINNER_INDEX = 30;

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
              {/* Mini photo */}
              <div className={`w-6 h-6 rounded-full overflow-hidden border flex-shrink-0 ${
                isCT ? 'border-sky-400/30' : 'border-amber-400/30'
              }`}>
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-[8px] text-gray-500 font-bold">
                    {p.name.charAt(0)}
                  </div>
                )}
              </div>
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

interface StripItem {
  player: Player;
  key: string;
}

function buildStrip(players: Player[], winner: Player): StripItem[] {
  const items: StripItem[] = [];
  for (let i = 0; i < VISIBLE_ITEMS; i++) {
    if (i === WINNER_INDEX) {
      items.push({ player: winner, key: `winner-${i}` });
    } else {
      const shuffled = shuffleArray(players);
      items.push({ player: shuffled[i % shuffled.length], key: `item-${i}` });
    }
  }
  return items;
}

export default function CaseOpening() {
  const { state, dispatch } = useGame();
  const { playTick, playWinner, playSwoosh, playCaseOpen, playProfileSound, muted, setMuted } = useSound();

  const [isRolling, setIsRolling] = useState(false);
  const [strip, setStrip] = useState<StripItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [winnerRevealed, setWinnerRevealed] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Player | null>(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [dimBackground, setDimBackground] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const lastTickIndexRef = useRef(-1);

  const turnColor = state.currentTurn === 'CT' ? 'ct' : 't';
  const turnLabel = state.currentTurn === 'CT' ? 'COUNTER-TERRORISTS' : 'TERRORISTS';

  const handleOpen = useCallback(() => {
    if (isRolling || state.availablePlayers.length === 0) return;

    const winner = state.availablePlayers[Math.floor(Math.random() * state.availablePlayers.length)];
    setCurrentWinner(winner);

    const newStrip = buildStrip(state.availablePlayers, winner);
    setStrip(newStrip);
    setOffset(0);
    setWinnerRevealed(false);
    setShowWinnerPopup(false);
    setIsRolling(true);
    setDimBackground(true);
    dispatch({ type: 'START_SPIN' });

    // Screen shake + case open sound
    setScreenShake(true);
    playCaseOpen();
    setTimeout(() => setScreenShake(false), 300);

    const containerWidth = containerRef.current?.offsetWidth || 600;
    const targetOffset = WINNER_INDEX * ITEM_TOTAL + ITEM_WIDTH / 2 - containerWidth / 2;
    const finalTarget = targetOffset + (Math.random() - 0.5) * (ITEM_WIDTH * 0.6);

    const DURATION = 5500; // slightly longer for drama
    startTimeRef.current = performance.now();
    lastTickIndexRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      // Quartic ease-out for more dramatic slowdown
      const eased = 1 - Math.pow(1 - progress, 4);
      let currentOffset = eased * finalTarget;

      // Micro-wobble near the end
      if (progress > 0.95) {
        const wobblePhase = (progress - 0.95) / 0.05;
        currentOffset += Math.sin(wobblePhase * Math.PI * 4) * 3 * (1 - wobblePhase);
      }

      setOffset(currentOffset);

      // Tick sound with increasing pitch as it slows
      const currentItemIndex = Math.floor(currentOffset / ITEM_TOTAL);
      if (currentItemIndex !== lastTickIndexRef.current) {
        lastTickIndexRef.current = currentItemIndex;
        playTick();
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Done - dramatic pause then reveal
        setIsRolling(false);
        setWinnerRevealed(true);

        // 500ms dramatic pause before popup
        setTimeout(() => {
          playWinner();
          setShowWinnerPopup(true);
          if (winner.soundUrl) {
            setTimeout(() => playProfileSound(winner.soundUrl!), 500);
          }
        }, 500);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isRolling, state.availablePlayers, dispatch, playTick, playWinner, playCaseOpen, playProfileSound]);

  const handleWinnerDismiss = useCallback(() => {
    if (!currentWinner) return;
    setShowWinnerPopup(false);
    setDimBackground(false);

    setTimeout(() => {
      dispatch({ type: 'SPIN_COMPLETE', payload: { playerId: currentWinner.id } });
      setWinnerRevealed(false);
      setCurrentWinner(null);
    }, 300);
  }, [currentWinner, dispatch]);

  const handleDirectPick = useCallback((player: Player) => {
    if (isRolling || state.isSpinning) return;
    playSwoosh();
    dispatch({ type: 'SPIN_COMPLETE', payload: { playerId: player.id } });
  }, [isRolling, state.isSpinning, dispatch, playSwoosh]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const displayStrip = strip.length > 0 ? strip : (() => {
    const items: StripItem[] = [];
    for (let i = 0; i < VISIBLE_ITEMS; i++) {
      if (state.availablePlayers.length > 0) {
        items.push({
          player: state.availablePlayers[i % state.availablePlayers.length],
          key: `display-${i}`,
        });
      }
    }
    return items;
  })();

  return (
    <>
      {/* Background dim during spin */}
      <AnimatePresence>
        {dimBackground && !showWinnerPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          x: screenShake ? [0, -3, 3, -2, 2, 0] : 0,
        }}
        transition={screenShake ? { duration: 0.3 } : undefined}
        className="w-full max-w-5xl mx-auto flex flex-col items-center gap-4 relative z-10"
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

        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-6">
          {/* CT - desktop only */}
          <div className="hidden lg:block">
            <MiniTeamList players={state.teamCT} team="CT" max={5} />
          </div>

          {/* Case Opening Strip */}
          <div className="flex-1 flex flex-col items-center gap-4 w-full min-w-0">
            <div className="w-full max-w-[600px] relative">
              {/* Center indicator line */}
              <div className="absolute left-1/2 -translate-x-[1px] top-0 bottom-0 w-[2px] bg-amber-400 z-20 shadow-[0_0_10px_rgba(255,179,0,0.8)]" />
              {/* Top triangle indicator */}
              <div className="absolute left-1/2 -translate-x-[8px] -top-3 z-20">
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-amber-400"
                  style={{ filter: `drop-shadow(0 0 6px ${COLORS.tGlow})` }} />
              </div>
              {/* Bottom triangle indicator */}
              <div className="absolute left-1/2 -translate-x-[8px] -bottom-3 z-20">
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-amber-400"
                  style={{ filter: `drop-shadow(0 0 6px ${COLORS.tGlow})` }} />
              </div>

              {/* Gradient edges */}
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
              {/* Top/bottom vignette */}
              <div className="absolute left-0 right-0 top-0 h-4 bg-gradient-to-b from-[#0d0d15] to-transparent z-10 pointer-events-none rounded-t-xl" />
              <div className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-[#0d0d15] to-transparent z-10 pointer-events-none rounded-b-xl" />

              {/* Strip container */}
              <div
                ref={containerRef}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0d15]"
              >
                {/* Scan-line overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                  }}
                />

                <div
                  className="flex py-3 transition-none"
                  style={{
                    transform: `translateX(-${offset}px)`,
                    gap: `${ITEM_GAP}px`,
                    paddingLeft: '4px',
                  }}
                >
                  {displayStrip.map((item, i) => {
                    const isWinner = winnerRevealed && i === WINNER_INDEX;
                    const hasPhoto = !!item.player.photoUrl;
                    return (
                      <div
                        key={item.key}
                        onClick={() => !isRolling && handleDirectPick(item.player)}
                        className={`
                          flex-shrink-0 flex flex-col items-center justify-center rounded-lg
                          font-rajdhani font-bold text-sm transition-all duration-300 overflow-hidden relative
                          ${isWinner
                            ? 'border-2 border-amber-400 shadow-[0_0_20px_rgba(255,179,0,0.4)] scale-105'
                            : 'border border-white/10 hover:bg-white/10 cursor-pointer'
                          }
                        `}
                        style={{
                          width: `${ITEM_WIDTH}px`,
                          height: '70px',
                        }}
                      >
                        {/* Photo background */}
                        {hasPhoto ? (
                          <>
                            <img
                              src={item.player.photoUrl!}
                              alt=""
                              className={`absolute inset-0 w-full h-full object-cover ${
                                isWinner ? 'opacity-70' : 'opacity-30'
                              }`}
                            />
                            <div className={`absolute inset-0 ${
                              isWinner
                                ? 'bg-gradient-to-t from-amber-900/80 to-transparent'
                                : 'bg-gradient-to-t from-[#0d0d15]/90 to-[#0d0d15]/40'
                            }`} />
                          </>
                        ) : (
                          <div className={`absolute inset-0 ${
                            isWinner ? 'bg-amber-500/30' : 'bg-white/5'
                          }`} />
                        )}

                        {/* Name */}
                        <span className={`relative z-10 truncate px-2 mt-auto mb-2 ${
                          isWinner ? 'text-amber-200' : 'text-gray-300'
                        }`}>
                          {item.player.name}
                        </span>

                        {/* Winner glow ring */}
                        {isWinner && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 border-2 border-amber-400 rounded-lg"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-500 font-rajdhani text-xs">
                Click a name to pick directly
              </p>
              <Button
                variant={state.currentTurn === 'CT' ? 'ct' : 't'}
                size="lg"
                onClick={handleOpen}
                disabled={isRolling || state.availablePlayers.length === 0}
              >
                {isRolling ? 'Opening...' : 'OPEN CASE'}
              </Button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMuted(!muted)}
                  className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-rajdhani cursor-pointer"
                >
                  {muted ? '🔇 Sound off' : '🔊 Sound on'}
                </button>
                {!isRolling && state.availablePlayers.length > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'SKIP_DRAFT' })}
                    className="text-gray-600 hover:text-gray-400 transition-colors text-xs font-rajdhani cursor-pointer"
                  >
                    Skip remaining &raquo;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* T - desktop only */}
          <div className="hidden lg:block">
            <MiniTeamList players={state.teamT} team="T" max={5} />
          </div>
        </div>

        {/* Mobile: Teams below */}
        <div className="w-full flex flex-col gap-4 lg:hidden">
          <MiniTeamList players={state.teamCT} team="CT" max={5} />
          <MiniTeamList players={state.teamT} team="T" max={5} />
        </div>
      </motion.div>

      {/* Winner Popup */}
      <WinnerPopup
        player={currentWinner}
        team={state.currentTurn}
        isVisible={showWinnerPopup}
        onDismiss={handleWinnerDismiss}
      />
    </>
  );
}
