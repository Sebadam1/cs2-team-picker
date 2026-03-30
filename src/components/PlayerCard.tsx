'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player, TeamSide } from '@/lib/types';
import { useGame } from '@/context/GameContext';

interface PlayerCardProps {
  player: Player;
  team: TeamSide;
}

export default function PlayerCard({ player, team }: PlayerCardProps) {
  const { state, dispatch } = useGame();
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const teamColors = team === 'CT'
    ? {
        bg: 'bg-sky-500/10 hover:bg-sky-500/20',
        border: isSelected ? 'border-sky-400 shadow-[0_0_15px_rgba(79,195,247,0.4)]' : 'border-sky-400/20 hover:border-sky-400/40',
        accent: 'bg-sky-400',
        text: 'text-sky-400',
        badge: 'bg-sky-500/20 text-sky-300',
      }
    : {
        bg: 'bg-amber-500/10 hover:bg-amber-500/20',
        border: isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(255,179,0,0.4)]' : 'border-amber-400/20 hover:border-amber-400/40',
        accent: 'bg-amber-400',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300',
      };

  const handleClick = () => {
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
      onClick={handleClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer
        transition-colors duration-200 select-none
        ${teamColors.bg} ${teamColors.border}
        ${isSelected ? 'ring-2 ring-white/20' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="w-4 h-0.5 bg-gray-500 rounded" />
        <div className="w-4 h-0.5 bg-gray-500 rounded" />
        <div className="w-4 h-0.5 bg-gray-500 rounded" />
      </div>

      {/* Photo */}
      <div className={`w-8 h-8 rounded-full overflow-hidden border flex-shrink-0 ${
        team === 'CT' ? 'border-sky-400/30' : 'border-amber-400/30'
      }`}>
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
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
  );
}
