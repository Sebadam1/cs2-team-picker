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

const ITEM_WIDTH = 180;
const ITEM_GAP = 5;
const ITEM_TOTAL = ITEM_WIDTH + ITEM_GAP;
const VISIBLE_ITEMS = 40;
const WINNER_INDEX = 30;
const ITEM_HEIGHT = 110;

function MiniTeamList({ players, team, max }: { players: Player[]; team: 'CT' | 'T'; max: number }) {
  const isCT = team === 'CT';
  const captain = players[0];
  const teamName = captain ? `${captain.name}'s` : (isCT ? 'Team 1' : 'Team 2');
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
  const [indicatorPulse, setIndicatorPulse] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const lastTickIndexRef = useRef(-1);

  const turnColor = state.currentTurn === 'CT' ? 'ct' : 't';
  const turnLabel = state.currentTurn === 'CT' ? 'COUNTER-TERRORISTS' : 'TERRORISTS';
  const isCT = state.currentTurn === 'CT';

  // Team-colored indicator
  const indicatorColor = isCT ? 'bg-sky-400' : 'bg-amber-400';
  const indicatorGlow = isCT
    ? 'shadow-[0_0_12px_rgba(79,195,247,0.9),0_0_30px_rgba(79,195,247,0.4)]'
    : 'shadow-[0_0_12px_rgba(255,179,0,0.9),0_0_30px_rgba(255,179,0,0.4)]';
  const indicatorBorder = isCT ? 'border-t-sky-400' : 'border-t-amber-400';
  const indicatorBorderBottom = isCT ? 'border-b-sky-400' : 'border-b-amber-400';
  const indicatorDropShadow = isCT
    ? `drop-shadow(0 0 8px ${COLORS.ctGlow})`
    : `drop-shadow(0 0 8px ${COLORS.tGlow})`;

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
    setIndicatorPulse(true);
    setNearEnd(false);
    dispatch({ type: 'START_SPIN' });

    // Screen shake + case open sound
    setScreenShake(true);
    playCaseOpen();
    setTimeout(() => setScreenShake(false), 300);

    const containerWidth = containerRef.current?.offsetWidth || 700;
    const targetOffset = WINNER_INDEX * ITEM_TOTAL + ITEM_WIDTH / 2 - containerWidth / 2;
    const finalTarget = targetOffset + (Math.random() - 0.5) * (ITEM_WIDTH * 0.6);

    const DURATION = 6000;
    startTimeRef.current = performance.now();
    lastTickIndexRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      // Quartic ease-out for dramatic slowdown
      const eased = 1 - Math.pow(1 - progress, 4);
      let currentOffset = eased * finalTarget;

      // Slow suspense wobble near end
      if (progress > 0.92) {
        if (!nearEnd) setNearEnd(true);
        const wobblePhase = (progress - 0.92) / 0.08;
        currentOffset += Math.sin(wobblePhase * Math.PI * 5) * 4 * (1 - wobblePhase);
      }

      setOffset(currentOffset);

      // Tick sound
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
        setIndicatorPulse(false);
        setWinnerRevealed(true);

        // 600ms dramatic pause before popup
        setTimeout(() => {
          if (winner.soundUrl) {
            playProfileSound(winner.soundUrl!);
          } else {
            playWinner();
          }
          setShowWinnerPopup(true);
        }, 600);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isRolling, state.availablePlayers, dispatch, playTick, playWinner, playCaseOpen, playProfileSound, nearEnd]);

  const handleWinnerDismiss = useCallback(() => {
    if (!currentWinner) return;
    setShowWinnerPopup(false);
    setDimBackground(false);
    setNearEnd(false);

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
            animate={{ opacity: nearEnd ? 0.6 : 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          x: screenShake ? [0, -4, 4, -3, 3, -1, 0] : 0,
        }}
        transition={screenShake ? { duration: 0.35 } : undefined}
        className="w-full max-w-6xl mx-auto flex flex-col items-center gap-4 relative z-10"
      >
        {/* Header */}
        <div className="text-center">
          <GlowText color={turnColor} className="text-2xl md:text-3xl mb-1">
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
            <div className="w-full max-w-[750px] relative">
              {/* Center indicator line - pulsing during roll */}
              <motion.div
                animate={indicatorPulse ? {
                  opacity: [0.7, 1, 0.7],
                  scaleX: [1, 1.5, 1],
                } : { opacity: 1, scaleX: 1 }}
                transition={indicatorPulse ? { duration: 0.4, repeat: Infinity } : undefined}
                className={`absolute left-1/2 -translate-x-[1.5px] top-0 bottom-0 w-[3px] ${indicatorColor} z-20 ${indicatorGlow} rounded-full`}
              />
              {/* Top triangle indicator */}
              <div className="absolute left-1/2 -translate-x-[10px] -top-4 z-20">
                <div className={`w-0 h-0 border-l-[10px] border-r-[10px] border-t-[13px] border-l-transparent border-r-transparent ${indicatorBorder}`}
                  style={{ filter: indicatorDropShadow }} />
              </div>
              {/* Bottom triangle indicator */}
              <div className="absolute left-1/2 -translate-x-[10px] -bottom-4 z-20">
                <div className={`w-0 h-0 border-l-[10px] border-r-[10px] border-b-[13px] border-l-transparent border-r-transparent ${indicatorBorderBottom}`}
                  style={{ filter: indicatorDropShadow }} />
              </div>

              {/* Gradient edges - wider for bigger strip */}
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
              {/* Top/bottom vignette */}
              <div className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-[#0d0d15] to-transparent z-10 pointer-events-none rounded-t-xl" />
              <div className="absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-[#0d0d15] to-transparent z-10 pointer-events-none rounded-b-xl" />

              {/* Outer glow border during roll */}
              <AnimatePresence>
                {isRolling && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`absolute -inset-[2px] rounded-xl z-0 pointer-events-none ${
                      isCT
                        ? 'shadow-[0_0_20px_rgba(79,195,247,0.3),inset_0_0_20px_rgba(79,195,247,0.1)]'
                        : 'shadow-[0_0_20px_rgba(255,179,0,0.3),inset_0_0_20px_rgba(255,179,0,0.1)]'
                    }`}
                  />
                )}
              </AnimatePresence>

              {/* Strip container */}
              <div
                ref={containerRef}
                className={`overflow-hidden rounded-xl border bg-[#0d0d15] transition-colors duration-500 ${
                  isRolling
                    ? (isCT ? 'border-sky-400/30' : 'border-amber-400/30')
                    : winnerRevealed
                      ? (isCT ? 'border-sky-400/50' : 'border-amber-400/50')
                      : 'border-white/10'
                }`}
              >
                {/* Scan-line overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                  }}
                />

                <div
                  className="flex py-4 transition-none"
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
                        className={`
                          flex-shrink-0 flex flex-col items-center justify-end rounded-lg
                          font-rajdhani font-bold transition-all duration-300 overflow-hidden relative
                          ${isWinner
                            ? `border-2 ${isCT ? 'border-sky-400 shadow-[0_0_30px_rgba(79,195,247,0.5)]' : 'border-amber-400 shadow-[0_0_30px_rgba(255,179,0,0.5)]'} scale-[1.03]`
                            : 'border border-white/10'
                          }
                        `}
                        style={{
                          width: `${ITEM_WIDTH}px`,
                          height: `${ITEM_HEIGHT}px`,
                        }}
                      >
                        {/* Photo background */}
                        {hasPhoto ? (
                          <>
                            <img
                              src={item.player.photoUrl!}
                              alt=""
                              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                                isWinner ? 'opacity-80' : 'opacity-30'
                              }`}
                            />
                            <div className={`absolute inset-0 ${
                              isWinner
                                ? (isCT
                                    ? 'bg-gradient-to-t from-sky-900/80 via-transparent to-sky-900/20'
                                    : 'bg-gradient-to-t from-amber-900/80 via-transparent to-amber-900/20')
                                : 'bg-gradient-to-t from-[#0d0d15]/90 via-[#0d0d15]/50 to-[#0d0d15]/30'
                            }`} />
                          </>
                        ) : (
                          <div className={`absolute inset-0 ${
                            isWinner
                              ? (isCT ? 'bg-sky-500/20' : 'bg-amber-500/20')
                              : 'bg-white/5'
                          }`} />
                        )}

                        {/* Initials for non-photo */}
                        {!hasPhoto && (
                          <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-orbitron text-2xl font-bold ${
                            isWinner
                              ? (isCT ? 'text-sky-400/40' : 'text-amber-400/40')
                              : 'text-white/10'
                          }`}>
                            {item.player.name.charAt(0).toUpperCase()}
                          </span>
                        )}

                        {/* Name bar at bottom */}
                        <div className={`relative z-10 w-full px-3 py-2 ${
                          isWinner
                            ? (isCT ? 'bg-sky-950/60' : 'bg-amber-950/60')
                            : 'bg-black/40'
                        }`}>
                          <span className={`block truncate text-center text-sm ${
                            isWinner
                              ? (isCT ? 'text-sky-200' : 'text-amber-200')
                              : 'text-gray-300'
                          }`}>
                            {item.player.name}
                          </span>
                        </div>

                        {/* Winner glow ring */}
                        {isWinner && (
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className={`absolute inset-0 border-2 rounded-lg ${
                              isCT ? 'border-sky-400' : 'border-amber-400'
                            }`}
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

            {/* Remaining players list */}
            {!isRolling && state.availablePlayers.length > 0 && (
              <div className="w-full max-w-[750px]">
                <p className="text-gray-500 font-orbitron text-[10px] uppercase tracking-wider text-center mb-2">
                  Left to draw ({state.availablePlayers.length})
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {state.availablePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleDirectPick(p)}
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
