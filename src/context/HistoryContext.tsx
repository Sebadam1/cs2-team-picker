'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Draft, DraftPick, Match, AnimationType, TeamSide, CS2Map } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';

interface HistoryContextValue {
  drafts: Draft[];
  matches: Match[];
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
    winningTeam: TeamSide;
    screenshot?: File;
  }) => Promise<Match>;
  getMatchForDraft: (draftId: string) => Match | undefined;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
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
      const [draftsRes, matchesRes] = await Promise.all([
        supabase.from('cs2picker_drafts').select('*').order('date', { ascending: false }),
        supabase.from('cs2picker_matches').select('*').order('played_at', { ascending: false }),
      ]);

      if (draftsRes.error) throw draftsRes.error;
      if (matchesRes.error) throw matchesRes.error;

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
          winningTeam: row.winning_team as TeamSide,
          screenshotUrl: row.screenshot_url as string | null,
          playedAt: row.played_at as string,
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
    winningTeam: TeamSide;
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
      screenshotUrl: row.screenshot_url,
      playedAt: row.played_at,
    };

    setMatches((prev) => [match, ...prev]);
    return match;
  }, []);

  const getMatchForDraft = useCallback((draftId: string) => {
    return matches.find((m) => m.draftId === draftId);
  }, [matches]);

  return (
    <HistoryContext.Provider value={{
      drafts,
      matches,
      loading,
      error,
      fetchHistory,
      saveDraft,
      saveMatch,
      getMatchForDraft,
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
