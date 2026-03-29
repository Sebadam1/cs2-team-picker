'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import type { PlayerProfile } from '@/lib/types';

interface ProfileCardProps {
  profile: PlayerProfile;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  selectable?: boolean;
}

export default function ProfileCard({ profile, onEdit, onDelete, selected, onToggleSelect, selectable }: ProfileCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const playSound = useCallback(() => {
    if (!profile.soundUrl || !audioRef.current) return;
    audioRef.current.src = profile.soundUrl;
    audioRef.current.play().catch(() => {});
  }, [profile.soundUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      onClick={selectable ? onToggleSelect : undefined}
      className={`
        relative group rounded-xl border p-4 transition-all duration-200
        ${selectable ? 'cursor-pointer' : ''}
        ${selected
          ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(0,230,118,0.15)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5'
        }
      `}
    >
      {/* Selection indicator */}
      {selectable && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? 'border-emerald-400 bg-emerald-400' : 'border-white/20 bg-transparent'
        }`}>
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 ${
          selected ? 'border-emerald-400/60' : 'border-white/10'
        }`}>
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center text-gray-500 font-orbitron text-lg font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-rajdhani font-bold text-white text-sm text-center truncate w-full">
          {profile.name}
        </h3>

        {/* Sound indicator */}
        {profile.soundUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); playSound(); }}
            className="text-gray-500 hover:text-emerald-400 transition-colors text-xs cursor-pointer"
            title="Play catchphrase"
          >
            🔊
          </button>
        )}

        {/* Actions (only when not in selection mode) */}
        {!selectable && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="px-2 py-1 text-xs font-rajdhani text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 cursor-pointer transition-all"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-2 py-1 text-xs font-rajdhani text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded border border-red-400/20 cursor-pointer transition-all"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </motion.div>
  );
}
