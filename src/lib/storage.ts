type Bucket = 'cs2picker-avatars' | 'cs2picker-sounds' | 'cs2picker-screenshots';

/**
 * Upload a file to Supabase Storage and return its public URL.
 */
export async function uploadFile(
  bucket: Bucket,
  file: File,
  path?: string
): Promise<string> {
  const { supabase } = await import('./supabase');
  const fileName = path || `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
export async function deleteFile(bucket: Bucket, publicUrl: string): Promise<void> {
  const { supabase } = await import('./supabase');
  const baseUrl = supabase.storage.from(bucket).getPublicUrl('').data.publicUrl;
  const path = publicUrl.replace(baseUrl, '');
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Get the public URL for a file in a bucket.
 */
export async function getPublicUrl(bucket: Bucket, path: string): Promise<string> {
  const { supabase } = await import('./supabase');
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
