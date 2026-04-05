'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Draft, DraftPick, Match, PlayerMatchStats, AnimationType, TeamSide, MatchOutcome, CS2Map } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';

interface HistoryContextValue {
  drafts: Draft[];
  matches: Match[];
  playerMatchStats: PlayerMatchStats[];
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  saveDraft: (data: {
    animationType: AnimationType;
    teamCT: DraftPick[];
    teamT: DraftPick[];
  }) => Promise<string>;
  saveMatch: (data: {
    draftId: string;
    mapName: CS2Map;
    winningTeam: MatchOutcome;
    scoreCT?: number;
    scoreT?: number;
    screenshot?: File;
  }) => Promise<Match>;
  updateMatch: (matchId: string, data: {
    mapName?: CS2Map;
    winningTeam?: MatchOutcome;
    scoreCT?: number | null;
    scoreT?: number | null;
  }) => Promise<void>;
  savePlayerMatchStats: (stats: {
    matchId: string;
    profileId: string;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
  }[]) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  getMatchForDraft: (draftId: string) => Match | undefined;
  getPlayerStatsForMatch: (matchId: string) => PlayerMatchStats[];
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerMatchStats, setPlayerMatchStats] = useState<PlayerMatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const { supabase } = await import('@/lib/supabase');
      const [draftsRes, matchesRes, statsRes] = await Promise.all([
        supabase.from('cs2picker_drafts').select('*').order('date', { ascending: false }),
        supabase.from('cs2picker_matches').select('*').order('played_at', { ascending: false }),
        supabase.from('cs2picker_match_player_stats').select('*'),
      ]);

      if (draftsRes.error) throw draftsRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (statsRes.error) throw statsRes.error;

      setDrafts(
        (draftsRes.data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          date: row.date as string,
          animationType: row.animation_type as AnimationType,
          teamCT: row.team_ct as DraftPick[],
          teamT: row.team_t as DraftPick[],
        }))
      );

      setMatches(
        (matchesRes.data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          draftId: row.draft_id as string,
          mapName: row.map_name as CS2Map,
          winningTeam: row.winning_team as MatchOutcome,
          scoreCT: (row.score_ct as number) ?? null,
          scoreT: (row.score_t as number) ?? null,
          screenshotUrl: row.screenshot_url as string | null,
          playedAt: row.played_at as string,
        }))
      );

      setPlayerMatchStats(
        (statsRes.data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          matchId: row.match_id as string,
          profileId: row.profile_id as string,
          kills: row.kills as number,
          deaths: row.deaths as number,
          assists: row.assists as number,
          damage: row.damage as number,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveDraft = useCallback(async (data: {
    animationType: AnimationType;
    teamCT: DraftPick[];
    teamT: DraftPick[];
  }): Promise<string> => {
    const { supabase } = await import('@/lib/supabase');
    const { data: row, error: err } = await supabase
      .from('cs2picker_drafts')
      .insert({
        animation_type: data.animationType,
        team_ct: data.teamCT,
        team_t: data.teamT,
      })
      .select()
      .single();

    if (err) throw err;

    const draft: Draft = {
      id: row.id,
      date: row.date,
      animationType: row.animation_type,
      teamCT: row.team_ct,
      teamT: row.team_t,
    };

    setDrafts((prev) => [draft, ...prev]);
    return draft.id;
  }, []);

  const saveMatch = useCallback(async (data: {
    draftId: string;
    mapName: CS2Map;
    winningTeam: MatchOutcome;
    scoreCT?: number;
    scoreT?: number;
    screenshot?: File;
  }): Promise<Match> => {
    const { supabase } = await import('@/lib/supabase');
    let screenshotUrl: string | null = null;
    if (data.screenshot) {
      screenshotUrl = await uploadFile('cs2picker-screenshots', data.screenshot);
    }

    const { data: row, error: err } = await supabase
      .from('cs2picker_matches')
      .insert({
        draft_id: data.draftId,
        map_name: data.mapName,
        winning_team: data.winningTeam,
        score_ct: data.scoreCT ?? null,
        score_t: data.scoreT ?? null,
        screenshot_url: screenshotUrl,
      })
      .select()
      .single();

    if (err) throw err;

    const match: Match = {
      id: row.id,
      draftId: row.draft_id,
      mapName: row.map_name,
      winningTeam: row.winning_team,
      scoreCT: row.score_ct ?? null,
      scoreT: row.score_t ?? null,
      screenshotUrl: row.screenshot_url,
      playedAt: row.played_at,
    };

    setMatches((prev) => [match, ...prev]);
    return match;
  }, []);

  const updateMatch = useCallback(async (matchId: string, data: {
    mapName?: CS2Map;
    winningTeam?: MatchOutcome;
    scoreCT?: number | null;
    scoreT?: number | null;
  }): Promise<void> => {
    const { supabase } = await import('@/lib/supabase');

    const updateData: Record<string, unknown> = {};
    if (data.mapName !== undefined) updateData.map_name = data.mapName;
    if (data.winningTeam !== undefined) updateData.winning_team = data.winningTeam;
    if (data.scoreCT !== undefined) updateData.score_ct = data.scoreCT;
    if (data.scoreT !== undefined) updateData.score_t = data.scoreT;

    const { error: err } = await supabase
      .from('cs2picker_matches')
      .update(updateData)
      .eq('id', matchId);

    if (err) throw err;

    setMatches((prev) => prev.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        ...(data.mapName !== undefined && { mapName: data.mapName }),
        ...(data.winningTeam !== undefined && { winningTeam: data.winningTeam }),
        ...(data.scoreCT !== undefined && { scoreCT: data.scoreCT }),
        ...(data.scoreT !== undefined && { scoreT: data.scoreT }),
      };
    }));
  }, []);

  const savePlayerMatchStats = useCallback(async (stats: {
    matchId: string;
    profileId: string;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
  }[]): Promise<void> => {
    if (stats.length === 0) return;
    const { supabase } = await import('@/lib/supabase');

    const rows = stats.map((s) => ({
      match_id: s.matchId,
      profile_id: s.profileId,
      kills: s.kills,
      deaths: s.deaths,
      assists: s.assists,
      damage: s.damage,
    }));

    // Upsert: if stats already exist for this match+profile, update them
    const { data: inserted, error: err } = await supabase
      .from('cs2picker_match_player_stats')
      .upsert(rows, { onConflict: 'match_id,profile_id' })
      .select();

    if (err) throw err;

    const newStats: PlayerMatchStats[] = (inserted || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      matchId: row.match_id as string,
      profileId: row.profile_id as string,
      kills: row.kills as number,
      deaths: row.deaths as number,
      assists: row.assists as number,
      damage: row.damage as number,
    }));

    setPlayerMatchStats((prev) => {
      // Remove old entries for these match+profile combos, add new ones
      const keys = new Set(newStats.map((s) => `${s.matchId}-${s.profileId}`));
      const filtered = prev.filter((s) => !keys.has(`${s.matchId}-${s.profileId}`));
      return [...filtered, ...newStats];
    });
  }, []);

  const deleteDraft = useCallback(async (draftId: string): Promise<void> => {
    const { supabase } = await import('@/lib/supabase');

    // Delete associated match first (cascade)
    const match = matches.find((m) => m.draftId === draftId);
    if (match) {
      if (match.screenshotUrl) {
        try {
          const { deleteFile } = await import('@/lib/storage');
          await deleteFile('cs2picker-screenshots', match.screenshotUrl);
        } catch { /* ignore storage errors */ }
      }
      await supabase.from('cs2picker_matches').delete().eq('draft_id', draftId);
      setMatches((prev) => prev.filter((m) => m.draftId !== draftId));
      // Player stats cascade-deleted by DB
      setPlayerMatchStats((prev) => prev.filter((s) => s.matchId !== match.id));
    }

    const { error: err } = await supabase.from('cs2picker_drafts').delete().eq('id', draftId);
    if (err) throw err;

    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  }, [matches]);

  const deleteMatch = useCallback(async (matchId: string): Promise<void> => {
    const { supabase } = await import('@/lib/supabase');
    const match = matches.find((m) => m.id === matchId);

    if (match?.screenshotUrl) {
      try {
        const { deleteFile } = await import('@/lib/storage');
        await deleteFile('cs2picker-screenshots', match.screenshotUrl);
      } catch { /* ignore storage errors */ }
    }

    const { error: err } = await supabase.from('cs2picker_matches').delete().eq('id', matchId);
    if (err) throw err;

    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    // Player stats cascade-deleted by DB
    setPlayerMatchStats((prev) => prev.filter((s) => s.matchId !== matchId));
  }, [matches]);

  const getMatchForDraft = useCallback((draftId: string) => {
    return matches.find((m) => m.draftId === draftId);
  }, [matches]);

  const getPlayerStatsForMatch = useCallback((matchId: string) => {
    return playerMatchStats.filter((s) => s.matchId === matchId);
  }, [playerMatchStats]);

  return (
    <HistoryContext.Provider value={{
      drafts,
      matches,
      playerMatchStats,
      loading,
      error,
      fetchHistory,
      saveDraft,
      saveMatch,
      updateMatch,
      savePlayerMatchStats,
      deleteDraft,
      deleteMatch,
      getMatchForDraft,
      getPlayerStatsForMatch,
    }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
