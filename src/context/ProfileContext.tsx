'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { PlayerProfile } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadFile, deleteFile } from '@/lib/storage';

interface ProfileContextValue {
  profiles: PlayerProfile[];
  loading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
  createProfile: (name: string, photo?: File, sound?: File) => Promise<PlayerProfile>;
  updateProfile: (id: string, data: { name?: string; photo?: File | null; sound?: File | null; removePhoto?: boolean; removeSound?: boolean }) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { supabase } = await import('@/lib/supabase');
      const { data, error: err } = await supabase
        .from('cs2picker_profiles')
        .select('*')
        .order('name');

      if (err) throw err;

      setProfiles(
        (data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          photoUrl: row.photo_url as string | null,
          soundUrl: row.sound_url as string | null,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const createProfile = useCallback(async (name: string, photo?: File, sound?: File): Promise<PlayerProfile> => {
    const { supabase } = await import('@/lib/supabase');
    let photoUrl: string | null = null;
    let soundUrl: string | null = null;

    if (photo) {
      photoUrl = await uploadFile('cs2picker-avatars', photo);
    }
    if (sound) {
      soundUrl = await uploadFile('cs2picker-sounds', sound);
    }

    const { data, error: err } = await supabase
      .from('cs2picker_profiles')
      .insert({ name, photo_url: photoUrl, sound_url: soundUrl })
      .select()
      .single();

    if (err) throw err;

    const profile: PlayerProfile = {
      id: data.id,
      name: data.name,
      photoUrl: data.photo_url,
      soundUrl: data.sound_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setProfiles((prev) => [...prev, profile].sort((a, b) => a.name.localeCompare(b.name)));
    return profile;
  }, []);

  const updateProfile = useCallback(async (id: string, data: { name?: string; photo?: File | null; sound?: File | null; removePhoto?: boolean; removeSound?: boolean }) => {
    const { supabase } = await import('@/lib/supabase');
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (data.name !== undefined) updates.name = data.name;

    // Handle photo
    if (data.removePhoto) {
      const profile = profiles.find((p) => p.id === id);
      if (profile?.photoUrl) await deleteFile('cs2picker-avatars', profile.photoUrl);
      updates.photo_url = null;
    } else if (data.photo) {
      const profile = profiles.find((p) => p.id === id);
      if (profile?.photoUrl) await deleteFile('cs2picker-avatars', profile.photoUrl);
      updates.photo_url = await uploadFile('cs2picker-avatars', data.photo);
    }

    // Handle sound
    if (data.removeSound) {
      const profile = profiles.find((p) => p.id === id);
      if (profile?.soundUrl) await deleteFile('cs2picker-sounds', profile.soundUrl);
      updates.sound_url = null;
    } else if (data.sound) {
      const profile = profiles.find((p) => p.id === id);
      if (profile?.soundUrl) await deleteFile('cs2picker-sounds', profile.soundUrl);
      updates.sound_url = await uploadFile('cs2picker-sounds', data.sound);
    }

    const { error: err } = await supabase
      .from('cs2picker_profiles')
      .update(updates)
      .eq('id', id);

    if (err) throw err;

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          name: (updates.name as string) ?? p.name,
          photoUrl: updates.photo_url !== undefined ? (updates.photo_url as string | null) : p.photoUrl,
          soundUrl: updates.sound_url !== undefined ? (updates.sound_url as string | null) : p.soundUrl,
          updatedAt: updates.updated_at as string,
        };
      }).sort((a, b) => a.name.localeCompare(b.name))
    );
  }, [profiles]);

  const deleteProfileFn = useCallback(async (id: string) => {
    const { supabase } = await import('@/lib/supabase');
    const profile = profiles.find((p) => p.id === id);
    if (profile?.photoUrl) {
      try { await deleteFile('cs2picker-avatars', profile.photoUrl); } catch {}
    }
    if (profile?.soundUrl) {
      try { await deleteFile('cs2picker-sounds', profile.soundUrl); } catch {}
    }

    const { error: err } = await supabase.from('cs2picker_profiles').delete().eq('id', id);
    if (err) throw err;

    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }, [profiles]);

  return (
    <ProfileContext.Provider value={{
      profiles,
      loading,
      error,
      fetchProfiles,
      createProfile,
      updateProfile,
      deleteProfile: deleteProfileFn,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfiles must be used within ProfileProvider');
  return context;
}
