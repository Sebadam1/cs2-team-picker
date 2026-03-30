'use client';

import { memo, useMemo } from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player, TeamSide } from '@/lib/types';
import { useGame } from '@/context/GameContext';
import { useHistory } from '@/context/HistoryContext';
import { useProfiles } from '@/context/ProfileContext';
import { computePlayerStats } from '@/lib/utils';
import { MAP_SHORT, CS2_MAPS } from '@/lib/constants';

interface PlayerCardProps {
  player: Player;
  team: TeamSide;
}

function MapWL({ wins, losses }: { wins: number; losses: number }) {
  return (
    <span className="text-[9px] font-orbitron font-bold leading-none inline-flex gap-[4px]">
      <span className="text-emerald-400/80">{wins}</span>
      <span className="text-red-400/80">{losses}</span>
    </span>
  );
}

function animateLayoutChanges(args: Parameters<typeof defaultAnimateLayoutChanges>[0]) {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) return false;
  return defaultAnimateLayoutChanges(args);
}

function PlayerCardInner({ player, team }: PlayerCardProps) {
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
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const mapStats = useMemo(() => {
    if (!player.profileId) return [];
    const allStats = computePlayerStats(profiles, drafts, matches);
    const playerStats = allStats.filter((s) => s.profileId === player.profileId);
    const statsMap = new Map(playerStats.map((s) => [s.mapName, s]));

    return CS2_MAPS.map((mapName) => {
      const s = statsMap.get(mapName);
      return {
        short: MAP_SHORT[mapName] || mapName.slice(0, 3),
        wins: s?.wins ?? 0,
        losses: s?.losses ?? 0,
      };
    });
  }, [player.profileId, profiles, drafts, matches]);

  const totalWins = mapStats.reduce((sum, s) => sum + s.wins, 0);
  const totalLosses = mapStats.reduce((sum, s) => sum + s.losses, 0);

  const isCT = team === 'CT';
  const teamColors = isCT
    ? {
        leftBorder: 'border-l-[#6b8fc2]',
        bg: isSelected ? 'bg-[#6b8fc2]/10' : 'bg-white/[0.02] hover:bg-white/[0.04]',
        border: isSelected ? 'border-[#6b8fc2]/40 shadow-[0_0_10px_rgba(107,143,194,0.15)]' : 'border-white/[0.04] hover:border-white/[0.08]',
        badge: 'bg-[#6b8fc2]/15 text-[#8bafd4]',
        photo: 'border-[#6b8fc2]/20',
      }
    : {
        leftBorder: 'border-l-[#c49a6c]',
        bg: isSelected ? 'bg-[#c49a6c]/10' : 'bg-white/[0.02] hover:bg-white/[0.04]',
        border: isSelected ? 'border-[#c49a6c]/40 shadow-[0_0_10px_rgba(196,154,108,0.15)]' : 'border-white/[0.04] hover:border-white/[0.08]',
        badge: 'bg-[#c49a6c]/15 text-[#d4a86a]',
        photo: 'border-[#c49a6c]/20',
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

  // Split stats into 2 columns for compact grid
  const mid = Math.ceil(mapStats.length / 2);
  const col1 = mapStats.slice(0, mid);
  const col2 = mapStats.slice(mid);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-md border border-l-[3px]
        cursor-grab active:cursor-grabbing
        transition-[color,background-color,border-color,box-shadow] duration-200 select-none touch-none
        ${teamColors.leftBorder} ${teamColors.bg} ${teamColors.border}
        ${isSelected ? 'ring-1 ring-white/10' : ''}
        ${isDragging ? 'shadow-lg shadow-black/40' : ''}
      `}
    >
      {/* Left side: handle + photo + badge + name */}
      <div className="flex items-center gap-3 pointer-events-none flex-shrink-0">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="w-4 h-0.5 bg-gray-700 rounded" />
          <div className="w-4 h-0.5 bg-gray-700 rounded" />
          <div className="w-4 h-0.5 bg-gray-700 rounded" />
        </div>

        <div className={`w-8 h-8 rounded-full overflow-hidden border flex-shrink-0 ${teamColors.photo}`}>
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full bg-white/[0.06] flex items-center justify-center text-gray-600 text-xs font-bold">
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded ${teamColors.badge}`}>
          #{player.pickOrder}
        </span>

        <span className="text-[#c8ccd4] font-rajdhani font-semibold text-base whitespace-nowrap">
          {player.name}
        </span>

        <span className="text-[10px] font-orbitron font-bold leading-none inline-flex items-center gap-[3px]">
          <span className="text-emerald-400/80">{totalWins}W</span>
          <span className="text-gray-700">/</span>
          <span className="text-red-400/80">{totalLosses}L</span>
        </span>
      </div>

      {/* Right side: 2-column mini map grid */}
      {mapStats.length > 0 && (
        <div className="flex gap-3 ml-auto pointer-events-none flex-shrink-0">
          {[col1, col2].map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((s) => (
                <div key={s.short} className="flex items-center gap-1.5">
                  <span className="text-gray-600 font-rajdhani text-[9px] leading-none w-[18px]">{s.short}</span>
                  <MapWL wins={s.wins} losses={s.losses} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PlayerCard = memo(PlayerCardInner, (prev, next) => {
  return prev.player.id === next.player.id
    && prev.player.name === next.player.name
    && prev.player.pickOrder === next.player.pickOrder
    && prev.team === next.team;
});

export default PlayerCard;
