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
        borderColor: 'border-[#6b8fc2]/15',
        headerBg: 'bg-gradient-to-r from-[#6b8fc2]/10 to-transparent',
        headerBorder: 'border-[#6b8fc2]/20',
      }
    : {
        color: 't' as const,
        borderColor: 'border-[#c49a6c]/15',
        headerBg: 'bg-gradient-to-r from-[#c49a6c]/10 to-transparent',
        headerBorder: 'border-[#c49a6c]/20',
      };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[280px] p-4 rounded-lg border transition-all duration-200
        bg-white/[0.015]
        ${teamConfig.borderColor}
        ${isOver ? 'bg-white/[0.03] scale-[1.005]' : ''}
      `}
    >
      {/* Team header */}
      <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${teamConfig.headerBorder} ${teamConfig.headerBg} -mx-4 -mt-4 px-4 pt-4 rounded-t-lg`}>
        <div className="min-w-0 flex-1">
          <GlowText color={teamConfig.color} as="h2" className="text-sm truncate uppercase tracking-wider">
            {teamName}
          </GlowText>
        </div>
        <span className="text-gray-600 font-orbitron text-xs flex-shrink-0">
          {players.length}/5
        </span>
      </div>

      {/* Player cards */}
      <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 min-h-[200px]">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} team={team} />
          ))}
          {players.length === 0 && (
            <div className="flex items-center justify-center h-[200px] text-gray-600 font-rajdhani text-sm border border-dashed border-white/[0.06] rounded-md">
              Drag players here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
