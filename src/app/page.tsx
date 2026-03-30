'use client';

import { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import ParticleBackground from '@/components/ParticleBackground';
import ProfileSelector from '@/components/profiles/ProfileSelector';
import PlayerInput from '@/components/PlayerInput';
import SpinWheel from '@/components/SpinWheel';
import CaseOpening from '@/components/CaseOpening';
import TeamDisplay from '@/components/TeamDisplay';
import ProfileManager from '@/components/profiles/ProfileManager';
import DraftHistory from '@/components/history/DraftHistory';
import PlayerStatsPanel from '@/components/stats/PlayerStatsPanel';
import Tabs from '@/components/ui/Tabs';
import { AnimatePresence, motion } from 'motion/react';

const TABS = [
  { id: 'draft', label: 'Draft', icon: '🎯' },
  { id: 'profiles', label: 'Profiles', icon: '👥' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

function DraftContent() {
  const { state } = useGame();
  const [useProfiles, setUseProfiles] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {state.phase === 'input' && (
        <motion.div key="input" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
          {useProfiles ? (
            <div>
              <ProfileSelector />
              <div className="text-center mt-4">
                <button
                  onClick={() => setUseProfiles(false)}
                  className="text-gray-600 hover:text-gray-400 font-rajdhani text-xs cursor-pointer transition-colors"
                >
                  Or enter names manually
                </button>
              </div>
            </div>
          ) : (
            <div>
              <PlayerInput />
              <div className="text-center mt-4">
                <button
                  onClick={() => setUseProfiles(true)}
                  className="text-gray-600 hover:text-gray-400 font-rajdhani text-xs cursor-pointer transition-colors"
                >
                  Or select from profiles
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      {state.phase === 'spinning' && (
        <motion.div key="spinning" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
          {state.animationType === 'case' ? <CaseOpening /> : <SpinWheel />}
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
  const [activeTab, setActiveTab] = useState('draft');

  const navigateToDraft = () => setActiveTab('draft');

  return (
    <GameProvider>
      {/* Top nav */}
      <div className="relative z-20 px-4 pt-4 pb-2 flex justify-center">
        <div className="w-full max-w-md">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'draft' && (
            <motion.div key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
              <DraftContent />
            </motion.div>
          )}
          {activeTab === 'profiles' && (
            <motion.div key="profiles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
              <ProfileManager />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
              <DraftHistory onNavigateToDraft={navigateToDraft} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
              <PlayerStatsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <ParticleBackground />
    </GameProvider>
  );
}
