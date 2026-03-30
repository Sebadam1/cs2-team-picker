'use client';

import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player, TeamSide } from '@/lib/types';
import { useGame } from '@/context/GameContext';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import { computePlayerStats } from '@/lib/utils';
import { MAP_SHORT } from '@/lib/constants';

interface PlayerCardProps {
  player: Player;
  team: TeamSide;
}

export default function PlayerCard({ player, team }: PlayerCardProps) {
  const { state, dispatch } = useGame();
  const { drafts, matches } = useHistory();
  const { profiles } = useProfiles();
  const isSelected = state.selectedForSwap === player.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: player.id,
    data: { team },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  // Per-map W/L for this player
  const mapStats = useMemo(() => {
    if (!player.profileId || matches.length === 0) return [];
    const allStats = computePlayerStats(profiles, drafts, matches);
    return allStats
      .filter((s) => s.profileId === player.profileId)
      .map((s) => ({
        short: MAP_SHORT[s.mapName] || s.mapName.slice(0, 3),
        wins: s.wins,
        losses: s.losses,
      }));
  }, [player.profileId, profiles, drafts, matches]);

  const teamColors = team === 'CT'
    ? {
        bg: 'bg-sky-500/10 hover:bg-sky-500/20',
        border: isSelected ? 'border-sky-400 shadow-[0_0_15px_rgba(79,195,247,0.4)]' : 'border-sky-400/20 hover:border-sky-400/40',
        badge: 'bg-sky-500/20 text-sky-300',
      }
    : {
        bg: 'bg-amber-500/10 hover:bg-amber-500/20',
        border: isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(255,179,0,0.4)]' : 'border-amber-400/20 hover:border-amber-400/40',
        badge: 'bg-amber-500/20 text-amber-300',
      };

  const handleClick = () => {
    if (isDragging) return;

    if (state.selectedForSwap === null) {
      dispatch({ type: 'SELECT_FOR_SWAP', payload: player.id });
    } else if (state.selectedForSwap === player.id) {
      dispatch({ type: 'CLEAR_SWAP_SELECTION' });
    } else {
      const selectedPlayer = [...state.teamCT, ...state.teamT].find(
        (p) => p.id === state.selectedForSwap
      );
      if (selectedPlayer && selectedPlayer.team !== team) {
        dispatch({
          type: 'SWAP_PLAYERS',
          payload: { playerA: state.selectedForSwap, playerB: player.id },
        });
      } else {
        dispatch({ type: 'SELECT_FOR_SWAP', payload: player.id });
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        flex flex-col gap-1 px-4 py-2.5 rounded-lg border
        cursor-grab active:cursor-grabbing
        transition-colors duration-200 select-none touch-none
        ${teamColors.bg} ${teamColors.border}
        ${isSelected ? 'ring-2 ring-white/20' : ''}
        ${isDragging ? 'shadow-lg shadow-black/40 ring-1 ring-white/10' : ''}
      `}
    >
      {/* Top row: drag handle, photo, badge, name */}
      <div className="flex items-center gap-3 pointer-events-none">
        {/* Drag handle indicator */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="w-4 h-0.5 bg-gray-500 rounded" />
          <div className="w-4 h-0.5 bg-gray-500 rounded" />
          <div className="w-4 h-0.5 bg-gray-500 rounded" />
        </div>

        {/* Photo */}
        <div className={`w-8 h-8 rounded-full overflow-hidden border flex-shrink-0 ${
          team === 'CT' ? 'border-sky-400/30' : 'border-amber-400/30'
        }`}>
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center text-gray-500 text-xs font-bold">
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Pick order badge */}
        <span className={`text-xs font-orbitron font-bold px-2 py-0.5 rounded ${teamColors.badge}`}>
          #{player.pickOrder}
        </span>

        {/* Player name */}
        <span className="text-white font-rajdhani font-semibold text-base flex-1">
          {player.name}
        </span>
      </div>

      {/* Bottom row: per-map W/L stats */}
      {mapStats.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 pl-[68px] pointer-events-none">
          {mapStats.map((s) => (
            <span key={s.short} className="text-[9px] font-rajdhani leading-tight">
              <span className="text-gray-500">{s.short}</span>
              {' '}
              <span className="text-emerald-400/80">{s.wins}W</span>
              <span className="text-gray-600">/</span>
              <span className="text-red-400/80">{s.losses}L</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
