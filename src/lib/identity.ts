import type { SessionData, UserProfile } from '../types';

const RESERVED_USERNAMES = new Set([
  'admin',
  'messme',
  'support',
  'system',
  'moderator',
  'help',
  'root',
  'official',
]);

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes username to lowercase, trimmed string
 */
export function normalizeUsername(username: string): string {
  return (username || '').trim().toLowerCase();
}

/**
 * Validates a username according to MessMe business rules
 */
export function validateUsername(username: string): UsernameValidationResult {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return { isValid: false, error: 'Username is required.' };
  }

  if (normalized.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters.' };
  }

  if (normalized.length > 20) {
    return { isValid: false, error: 'Username cannot exceed 20 characters.' };
  }

  const validRegex = /^[a-zA-Z0-9_]+$/;
  if (!validRegex.test(normalized)) {
    return { isValid: false, error: 'Only letters, numbers, and underscores are allowed.' };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { isValid: false, error: 'This username is reserved by MessMe.' };
  }

  return { isValid: true };
}

/**
 * Generate a cryptographically strong session token
 */
export function generateSessionToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return 'mm_tok_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return 'mm_tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Generate a unique UUID
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_SESSION_KEY = 'messme_secure_session';
const STORAGE_PROFILE_KEY = 'messme_user_profile';

/**
 * Retrieve saved session from persistent browser storage
 */
export function getSavedSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch (err) {
    console.error('Error reading saved session:', err);
    return null;
  }
}

/**
 * Retrieve saved profile
 */
export function getSavedProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (err) {
    console.error('Error reading saved profile:', err);
    return null;
  }
}

/**
 * Save session and profile securely to storage
 */
export function saveSessionAndProfile(session: SessionData, profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

/**
 * Clear local session
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_PROFILE_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}
