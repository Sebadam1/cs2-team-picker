'use client';

import { GameProvider, useGame } from '@/context/GameContext';
import ParticleBackground from '@/components/ParticleBackground';
import PlayerInput from '@/components/PlayerInput';
import SpinWheel from '@/components/SpinWheel';
import TeamDisplay from '@/components/TeamDisplay';
import { AnimatePresence, motion } from 'motion/react';

function GameContent() {
  const { state } = useGame();

  return (
    <AnimatePresence mode="wait">
      {state.phase === 'input' && (
        <motion.div key="input" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
          <PlayerInput />
        </motion.div>
      )}
      {state.phase === 'spinning' && (
        <motion.div key="spinning" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
          <SpinWheel />
        </motion.div>
      )}
      {state.phase === 'results' && (
        <motion.div key="results" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
          <TeamDisplay />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10 overflow-y-auto">
        <GameContent />
      </main>
      <ParticleBackground />
    </GameProvider>
  );
}
