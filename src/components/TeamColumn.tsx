'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Player, TeamSide } from '@/lib/types';
import PlayerCard from './PlayerCard';
import GlowText from './ui/GlowText';

interface TeamColumnProps {
  team: TeamSide;
  players: Player[];
}

export default function TeamColumn({ team, players }: TeamColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `team-${team}`,
    data: { team },
  });

  const isCT = team === 'CT';

  // Dynamic team name: first player's name + "'s Team"
  const captain = players[0];
  const teamName = captain ? `${captain.name}'s Team` : (isCT ? 'Team A' : 'Team B');

  const teamConfig = isCT
    ? {
        color: 'ct' as const,
        borderColor: 'border-sky-400/30',
        bgHover: 'bg-sky-500/10',
        shield: (
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-sky-400" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.06-7 10.2-3.87-1.14-7-5.53-7-10.2V6.3l7-3.12z" />
          </svg>
        ),
      }
    : {
        color: 't' as const,
        borderColor: 'border-amber-400/30',
        bgHover: 'bg-amber-500/10',
        shield: (
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-400" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        ),
      };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[280px] p-4 rounded-xl border transition-all duration-200
        bg-white/[0.02] backdrop-blur-sm
        ${teamConfig.borderColor}
        ${isOver ? `${teamConfig.bgHover} border-opacity-60 scale-[1.01]` : ''}
      `}
    >
      {/* Team header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        {teamConfig.shield}
        <div className="min-w-0">
          <GlowText color={teamConfig.color} as="h2" className="text-lg truncate">
            {teamName}
          </GlowText>
        </div>
        <span className="ml-auto text-gray-500 font-orbitron text-sm flex-shrink-0">
          {players.length}/5
        </span>
      </div>

      {/* Player cards */}
      <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} team={team} />
          ))}
          {players.length === 0 && (
            <div className="flex items-center justify-center h-[200px] text-gray-600 font-rajdhani text-sm border border-dashed border-white/10 rounded-lg">
              Drag players here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
