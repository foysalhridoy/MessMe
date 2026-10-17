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

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Pre-generated sweet chime audio element for reliable background and mobile playback
let sweetAudioElement: HTMLAudioElement | null = null;

function getSweetAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (sweetAudioElement) return sweetAudioElement;

  try {
    const sampleRate = 44100;
    const duration = 0.85;
    const totalSamples = Math.floor(sampleRate * duration);
    const buffer = new Int16Array(totalSamples);

    // Warm, melodious 4-note acoustic glass chime (E Major arpeggio)
    const notes = [
      { freq: 659.25, start: 0.00, dur: 0.50, gain: 0.22 }, // E5
      { freq: 830.61, start: 0.08, dur: 0.55, gain: 0.25 }, // G#5
      { freq: 987.77, start: 0.16, dur: 0.60, gain: 0.27 }, // B5
      { freq: 1318.51, start: 0.24, dur: 0.60, gain: 0.29 }, // E6
    ];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const attack = Math.min(1, noteT / 0.012);
          const decay = Math.exp(-noteT * 7.5);
          const env = attack * decay * note.gain;
          // Fundamental + warm harmonic overtone (octave) + subtle third harmonic
          const s =
            Math.sin(2 * Math.PI * note.freq * noteT) +
            0.28 * Math.sin(2 * Math.PI * (note.freq * 2) * noteT) +
            0.08 * Math.sin(2 * Math.PI * (note.freq * 3) * noteT);
          sample += s * env;
        }
      }

      const clamped = Math.max(-0.95, Math.min(0.95, sample));
      buffer[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    const subChunk2Size = totalSamples * 2;
    const chunkSize = 36 + subChunk2Size;
    const wavBuffer = new ArrayBuffer(44 + subChunk2Size);
    const view = new DataView(wavBuffer);

    // RIFF identifier & sizes
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, chunkSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, subChunk2Size, true);

    const int16View = new Int16Array(wavBuffer, 44);
    int16View.set(buffer);

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const blobUrl = URL.createObjectURL(blob);
    sweetAudioElement = new Audio(blobUrl);
    sweetAudioElement.volume = 0.75;
    return sweetAudioElement;
  } catch (err) {
    console.warn('Failed to synthesize fallback sweet chime audio:', err);
    return null;
  }
}

/**
 * Play a sweet, pleasant acoustic chime when a new message arrives.
 * Works across both active and background tabs with haptic feedback.
 */
export function playNotificationSound() {
  try {
    // 1. Mobile haptic vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 60, 120]);
      } catch {
        // Ignore vibration error
      }
    }

    // 2. Play using HTML5 Audio for reliable background playback
    const audioEl = getSweetAudioElement();
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
    }

    // 3. Also play via Web Audio API for rich multi-channel output
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state !== 'closed') {
      const startTime = ctx.currentTime;
      // Arpeggiated sweet chime chord: E5, G#5, B5, E6
      const notes = [
        { freq: 659.25, time: 0.00, duration: 0.45, gain: 0.16 },
        { freq: 830.61, time: 0.08, duration: 0.50, gain: 0.18 },
        { freq: 987.77, time: 0.16, duration: 0.55, gain: 0.20 },
        { freq: 1318.51, time: 0.24, duration: 0.55, gain: 0.22 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime + note.time);

        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(note.freq * 2, startTime + note.time);

        const tStart = startTime + note.time;
        const tEnd = tStart + note.duration;

        noteGain.gain.setValueAtTime(0.001, tStart);
        noteGain.gain.exponentialRampToValueAtTime(note.gain, tStart + 0.012);
        noteGain.gain.exponentialRampToValueAtTime(0.001, tEnd);

        osc.connect(noteGain);
        overtone.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(tStart);
        overtone.start(tStart);
        osc.stop(tEnd);
        overtone.stop(tEnd);
      });
    }
  } catch {
    // Ignore autoplay or browser restrictions
  }
}

/**
 * Play a crisp subtle pop sound on sending a message
 */
export function playSendSound() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
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


