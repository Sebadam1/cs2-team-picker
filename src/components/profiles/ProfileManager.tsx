'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfiles } from '@/context/ProfileContext';
import type { PlayerProfile } from '@/lib/types';
import ProfileCard from './ProfileCard';
import ProfileForm from './ProfileForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import GlowText from '../ui/GlowText';

export default function ProfileManager() {
  const { profiles, loading, error, createProfile, updateProfile, deleteProfile } = useProfiles();
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PlayerProfile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = useCallback(async (data: { name: string; photo?: File | null; sound?: File | null }) => {
    await createProfile(data.name, data.photo || undefined, data.sound || undefined);
    setShowForm(false);
  }, [createProfile]);

  const handleUpdate = useCallback(async (data: { name?: string; photo?: File | null; sound?: File | null; removePhoto?: boolean; removeSound?: boolean }) => {
    if (!editingProfile) return;
    await updateProfile(editingProfile.id, data);
    setEditingProfile(null);
  }, [editingProfile, updateProfile]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteProfile(id);
    setDeleteConfirm(null);
  }, [deleteProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-rajdhani">Loading profiles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-rajdhani mb-4">{error}</p>
        <p className="text-gray-500 font-rajdhani text-sm">Make sure Supabase is configured correctly.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <GlowText color="green" as="h2" className="text-2xl mb-1">
            PLAYER PROFILES
          </GlowText>
          <p className="text-gray-400 font-rajdhani text-sm">{profiles.length} profiles saved</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
          + Add Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-500 font-rajdhani text-lg mb-2">No profiles yet</p>
          <p className="text-gray-600 font-rajdhani text-sm mb-6">Create player profiles to use in drafts</p>
          <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
            Create First Profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => setEditingProfile(profile)}
                onDelete={() => setDeleteConfirm(profile.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Profile">
        <ProfileForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingProfile} onClose={() => setEditingProfile(null)} title="Edit Profile">
        {editingProfile && (
          <ProfileForm
            profile={editingProfile}
            onSubmit={handleUpdate}
            onCancel={() => setEditingProfile(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Profile">
        <div className="text-center">
          <p className="text-gray-300 font-rajdhani mb-6">
            Are you sure you want to delete this profile? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
