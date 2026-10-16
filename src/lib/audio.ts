/**
 * Voice Audio Utilities for MessMe
 * Handles real audio recording, microphone playback, and data formatting.
 */

import { getSupabaseClient } from './supabase';

export interface AudioRecordingResult {
  blob: Blob;
  duration: number;
  url: string;
}

/**
 * Format seconds into mm:ss
 */
export function formatAudioDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Convert Blob to Base64 Data URL for persistent local storage
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload voice audio to Supabase Storage or fallback to base64 DataURL
 */
export async function uploadVoiceAudio(blob: Blob, userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webm`;
      const { data, error } = await supabase.storage
        .from('messme-audio')
        .upload(fileName, blob, {
          contentType: blob.type || 'audio/webm',
          upsert: false,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('messme-audio')
          .getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to local data URL:', err);
    }
  }

  // Fallback: convert to DataURL for local persistence
  return await blobToDataUrl(blob);
}
