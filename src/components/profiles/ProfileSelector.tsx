'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useProfiles } from '@/context/ProfileContext';
import { useGame } from '@/context/GameContext';
import { TOTAL_PLAYERS } from '@/lib/constants';
import type { AnimationType } from '@/lib/types';
import ProfileCard from './ProfileCard';
import Button from '../ui/Button';
import GlowText from '../ui/GlowText';

export default function ProfileSelector() {
  const { profiles, loading } = useProfiles();
  const { dispatch } = useGame();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [animationType, setAnimationType] = useState<AnimationType>('wheel');

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < TOTAL_PLAYERS) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (profiles.length <= TOTAL_PLAYERS) {
      setSelected(new Set(profiles.map((p) => p.id)));
    }
  }, [profiles]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleStart = useCallback(() => {
    if (selected.size !== TOTAL_PLAYERS) return;
    const selectedProfiles = profiles.filter((p) => selected.has(p.id));
    dispatch({ type: 'SET_PLAYERS', payload: { profiles: selectedProfiles, animationType } });
  }, [selected, profiles, animationType, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-rajdhani">Loading profiles...</div>
      </div>
    );
  }

  if (profiles.length < TOTAL_PLAYERS) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <GlowText color="green" as="h2" className="text-2xl mb-4">
          NOT ENOUGH PROFILES
        </GlowText>
        <p className="text-gray-400 font-rajdhani mb-2">
          You need at least {TOTAL_PLAYERS} profiles to start a draft.
        </p>
        <p className="text-gray-500 font-rajdhani text-sm">
          Currently: {profiles.length} / {TOTAL_PLAYERS}
        </p>
        <p className="text-gray-600 font-rajdhani text-sm mt-4">
          Go to the Profiles tab to create more.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-6">
        <GlowText color="green" className="text-3xl md:text-4xl mb-2">
          CS2 TEAM PICKER
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-lg">
          Select {TOTAL_PLAYERS} players for the draft
        </p>
        <p className={`font-orbitron text-sm mt-2 ${
          selected.size === TOTAL_PLAYERS ? 'text-emerald-400' : 'text-gray-500'
        }`}>
          {selected.size} / {TOTAL_PLAYERS} selected
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 justify-center mb-4">
        {profiles.length === TOTAL_PLAYERS && (
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
        )}
        {selected.size > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        )}
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onEdit={() => {}}
            onDelete={() => {}}
            selectable
            selected={selected.has(profile.id)}
            onToggleSelect={() => toggleSelect(profile.id)}
          />
        ))}
      </div>

      {/* Animation Type Selector */}
      <div className="mb-6">
        <p className="text-center text-gray-400 font-rajdhani text-sm mb-3 uppercase tracking-wider">
          Draft Animation
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setAnimationType('wheel')}
            className={`
              flex-1 max-w-[220px] px-4 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
              ${animationType === 'wheel'
                ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(0,230,118,0.15)]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
              }
            `}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🎡</div>
              <div className={`font-orbitron text-sm font-bold ${animationType === 'wheel' ? 'text-emerald-400' : 'text-gray-400'}`}>
                SPIN WHEEL
              </div>
              <div className="text-gray-500 font-rajdhani text-xs mt-1">
                Classic fortune wheel
              </div>
            </div>
          </button>
          <button
            onClick={() => setAnimationType('case')}
            className={`
              flex-1 max-w-[220px] px-4 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
              ${animationType === 'case'
                ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_20px_rgba(255,179,0,0.15)]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
              }
            `}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className={`font-orbitron text-sm font-bold ${animationType === 'case' ? 'text-amber-400' : 'text-gray-400'}`}>
                CASE OPENING
              </div>
              <div className="text-gray-500 font-rajdhani text-xs mt-1">
                CS2 case unboxing style
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          disabled={selected.size !== TOTAL_PLAYERS}
        >
          Start Draft
        </Button>
      </div>
    </motion.div>
  );
}
