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

/**
 * Play a subtle modern chime when a new message arrives from another device
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore autoplay or browser audio restrictions
  }
}

/**
 * Play a crisp subtle pop sound on sending a message
 */
export function playSendSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {
    // Ignore restrictions
  }
}

