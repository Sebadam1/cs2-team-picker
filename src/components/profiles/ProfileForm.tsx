'use client';

import { useState, useRef, useCallback } from 'react';
import type { PlayerProfile } from '@/lib/types';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';

interface ProfileFormProps {
  profile?: PlayerProfile;
  onSubmit: (data: { name: string; photo?: File | null; sound?: File | null; removePhoto?: boolean; removeSound?: boolean }) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileForm({ profile, onSubmit, onCancel }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [sound, setSound] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeSound, setRemoveSound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        photo: photo || (removePhoto ? null : undefined),
        sound: sound || (removeSound ? null : undefined),
        removePhoto,
        removeSound,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [name, photo, sound, removePhoto, removeSound, onSubmit]);

  const handleSoundPreview = useCallback(() => {
    if (!audioRef.current) return;
    const url = sound ? URL.createObjectURL(sound) : profile?.soundUrl;
    if (!url) return;
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  }, [sound, profile?.soundUrl]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name input */}
      <div>
        <label className="block text-sm font-rajdhani font-semibold text-gray-300 mb-1">Player Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-md text-[#c8ccd4] font-rajdhani
            placeholder:text-gray-600 focus:outline-none focus:border-[#8b9bb4]/40 focus:bg-white/[0.05]
            transition-all duration-200"
          autoFocus
        />
      </div>

      {/* Photo upload */}
      <FileUpload
        accept="image/*"
        label="Profile Photo"
        hint="JPG, PNG, WebP. Max 2MB."
        currentUrl={!removePhoto ? profile?.photoUrl : null}
        onFileSelect={(file) => {
          setPhoto(file);
          if (file) setRemovePhoto(false);
        }}
        previewType="image"
      />
      {profile?.photoUrl && !removePhoto && !photo && (
        <button
          type="button"
          onClick={() => setRemovePhoto(true)}
          className="text-red-400 text-xs font-rajdhani hover:text-red-300 cursor-pointer"
        >
          Remove current photo
        </button>
      )}

      {/* Sound upload */}
      <FileUpload
        accept="audio/*"
        label="Catchphrase Sound"
        hint="MP3, WAV, OGG. Max 5MB."
        currentUrl={!removeSound ? profile?.soundUrl : null}
        onFileSelect={(file) => {
          setSound(file);
          if (file) setRemoveSound(false);
        }}
        previewType="audio"
      />
      {(sound || (profile?.soundUrl && !removeSound)) && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSoundPreview}
            className="text-[#8b9bb4] text-xs font-rajdhani hover:text-[#a0b0c8] cursor-pointer flex items-center gap-1"
          >
            <span>🔊</span> Play preview
          </button>
          {profile?.soundUrl && !removeSound && !sound && (
            <button
              type="button"
              onClick={() => setRemoveSound(true)}
              className="text-red-400 text-xs font-rajdhani hover:text-red-300 cursor-pointer"
            >
              Remove current sound
            </button>
          )}
        </div>
      )}

      <audio ref={audioRef} className="hidden" />

      {error && (
        <p className="text-red-400 text-sm font-rajdhani">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="font-rajdhani font-bold uppercase tracking-wider border rounded-md transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-b from-[#3a7a3a] to-[#2d5e2d] border-[#4a8a4a]/40 text-[#a8d8a8] hover:from-[#438a43] hover:to-[#356e35] hover:border-[#5a9a5a]/50 px-3 py-1.5 text-sm"
        >
          {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
}
