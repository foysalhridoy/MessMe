import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback credentials to ensure seamless cross-device communication out of the box
const DEFAULT_SUPABASE_URL = 'https://tjmclqwhrkrdncgrndno.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbWNscXdocmtyZG5jZ3JuZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzg5MTUsImV4cCI6MjEwNzcxNDkxNX0.VJJWrKe-_aSgqFAMfbHAuD5_ywDRlqkyLcxljYgqX3k';

// Retrieve from environment or fallback, or localStorage override (for testing in UI)
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('messme_supabase_url') || '' : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('messme_supabase_key') || '' : '';

const rawUrl = localUrl || envUrl;
const cleanUrl = (url: string): string => {
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

export const SUPABASE_URL = cleanUrl(rawUrl);
export const SUPABASE_ANON_KEY = (localKey || envKey).trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY.length > 20
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      clientInstance = null;
    }
  }

  return clientInstance;
};

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('messme_supabase_url', url.trim());
    localStorage.setItem('messme_supabase_key', key.trim());
  } else {
    localStorage.removeItem('messme_supabase_url');
    localStorage.removeItem('messme_supabase_key');
  }
  clientInstance = null;
  window.location.reload();
};
