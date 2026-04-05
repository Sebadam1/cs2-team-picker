import type { Draft, Match, PlayerMatchStats, PlayerProfile, PlayerStats } from './types';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Compute per-player-per-map stats from drafts, matches, and player match stats.
 * Includes wins, losses, draws, K/D/A, damage, and total rounds for ADR calculation.
 */
export function computePlayerStats(
  profiles: PlayerProfile[],
  drafts: Draft[],
  matches: Match[],
  playerMatchStats: PlayerMatchStats[] = []
): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  // Index player match stats by matchId+profileId for fast lookup
  const pmsIndex = new Map<string, PlayerMatchStats>();
  for (const pms of playerMatchStats) {
    pmsIndex.set(`${pms.matchId}-${pms.profileId}`, pms);
  }

  for (const match of matches) {
    const draft = drafts.find((d) => d.id === match.draftId);
    if (!draft) continue;

    const ctProfileIds = draft.teamCT.map((p) => p.profileId);
    const tProfileIds = draft.teamT.map((p) => p.profileId);
    const allIds = [...ctProfileIds, ...tProfileIds];

    // Total rounds in this match (from score if available)
    const totalRounds = (match.scoreCT ?? 0) + (match.scoreT ?? 0);

    for (const profileId of allIds) {
      const key = `${profileId}-${match.mapName}`;
      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) continue;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          profileId,
          profileName: profile.name,
          mapName: match.mapName,
          wins: 0,
          losses: 0,
          draws: 0,
          totalGames: 0,
          winRate: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          damage: 0,
          totalRounds: 0,
        });
      }

      const stat = statsMap.get(key)!;
      stat.totalGames += 1;
      stat.totalRounds += totalRounds;

      if (match.winningTeam === 'draw') {
        stat.draws += 1;
      } else {
        const isOnCT = ctProfileIds.includes(profileId);
        const won =
          (isOnCT && match.winningTeam === 'CT') ||
          (!isOnCT && match.winningTeam === 'T');

        if (won) {
          stat.wins += 1;
        } else {
          stat.losses += 1;
        }
      }

      stat.winRate = stat.totalGames > 0 ? Math.round((stat.wins / stat.totalGames) * 100) : 0;

      // Add KDA/damage from player match stats
      const pms = pmsIndex.get(`${match.id}-${profileId}`);
      if (pms) {
        stat.kills += pms.kills;
        stat.deaths += pms.deaths;
        stat.assists += pms.assists;
        stat.damage += pms.damage;
      }
    }
  }

  return Array.from(statsMap.values());
}
