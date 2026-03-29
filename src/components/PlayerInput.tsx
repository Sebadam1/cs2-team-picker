'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { useGame } from '@/context/GameContext';
import { TOTAL_PLAYERS, DEFAULT_NAMES } from '@/lib/constants';
import { shuffleArray } from '@/lib/utils';
import Button from './ui/Button';
import GlowText from './ui/GlowText';

export default function PlayerInput() {
  const { dispatch } = useGame();
  const [names, setNames] = useState<string[]>(Array(TOTAL_PLAYERS).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateName = useCallback((index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = index + 1;
      if (next < TOTAL_PLAYERS) {
        inputRefs.current[next]?.focus();
      }
    }
  }, []);

  const allFilled = names.every((n) => n.trim().length > 0);
  const hasDuplicates = new Set(names.filter((n) => n.trim()).map((n) => n.trim().toLowerCase())).size !== names.filter((n) => n.trim()).length;

  const handleStart = () => {
    if (!allFilled || hasDuplicates) return;
    dispatch({ type: 'SET_PLAYERS', payload: names.map((n) => n.trim()) });
  };

  const handleShuffle = () => {
    const filled = names.filter((n) => n.trim());
    if (filled.length === 0) return;
    const shuffled = shuffleArray(filled);
    const newNames = [...Array(TOTAL_PLAYERS).fill('')];
    shuffled.forEach((name, i) => {
      newNames[i] = name;
    });
    setNames(newNames);
  };

  const handleFillDefaults = () => {
    setNames(DEFAULT_NAMES);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <GlowText color="green" className="text-3xl md:text-4xl mb-2">
          CS2 TEAM PICKER
        </GlowText>
        <p className="text-gray-400 font-rajdhani text-lg">
          Zadej 10 hráčů pro losování do týmů
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {names.map((name, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-gray-400 font-orbitron group-focus-within:bg-emerald-500/20 group-focus-within:text-emerald-400 transition-colors">
                {i + 1}
              </div>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                placeholder={`Hráč ${i + 1}`}
                className="w-full pl-13 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg
                  text-white font-rajdhani text-base
                  placeholder:text-gray-600
                  focus:outline-none focus:border-emerald-400/50 focus:bg-white/8
                  focus:shadow-[0_0_15px_rgba(0,230,118,0.15)]
                  transition-all duration-200"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {hasDuplicates && allFilled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-center text-sm mb-4 font-rajdhani"
        >
          Jména hráčů musí být unikátní!
        </motion.p>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Button variant="ghost" size="sm" onClick={handleFillDefaults}>
          Výchozí jména
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShuffle} disabled={!names.some((n) => n.trim())}>
          Zamíchat pořadí
        </Button>
        <Button variant="primary" size="lg" onClick={handleStart} disabled={!allFilled || hasDuplicates}>
          Začít losování
        </Button>
      </div>
    </motion.div>
  );
}
