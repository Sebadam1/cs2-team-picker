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
          ? 'border-[#4a8a4a]/50 bg-[#3a7a3a]/10'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
        }
      `}
    >
      {/* Selection indicator */}
      {selectable && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? 'border-[#4a8a4a] bg-[#4a8a4a]' : 'border-white/[0.12] bg-transparent'
        }`}>
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#0d0f13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 ${
          selected ? 'border-[#4a8a4a]/50' : 'border-white/[0.06]'
        }`}>
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/[0.06] flex items-center justify-center text-gray-600 font-orbitron text-lg font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-rajdhani font-bold text-[#c8ccd4] text-sm text-center truncate w-full">
          {profile.name}
        </h3>

        {/* Sound indicator */}
        {profile.soundUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); playSound(); }}
            className="text-gray-600 hover:text-[#8b9bb4] transition-colors text-xs cursor-pointer"
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
              className="px-2 py-1 text-xs font-rajdhani text-gray-500 hover:text-[#c8ccd4] bg-white/[0.03] hover:bg-white/[0.06] rounded border border-white/[0.06] cursor-pointer transition-all"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-2 py-1 text-xs font-rajdhani text-[#d46a6a] hover:text-red-300 bg-[#5a2020]/20 hover:bg-[#5a2020]/30 rounded border border-[#8b3030]/20 cursor-pointer transition-all"
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
