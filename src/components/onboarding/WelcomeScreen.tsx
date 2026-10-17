import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Loader2, Sparkles, Shield, Camera, Upload, X } from 'lucide-react';
import { checkUsernameAvailability } from '../../services/db';
import { validateUsername } from '../../lib/identity';
import { useChat } from '../../context/useChat';
import { SessionRecoveryModal } from './SessionRecoveryModal';
import { Avatar } from '../common/Avatar';
import { CuratedAvatarPicker } from '../common/CuratedAvatarPicker';
import { compressAvatarImage } from '../../lib/avatars';

export const WelcomeScreen: React.FC = () => {
  const { onboardUser, loginWithUsername, showToast } = useChat();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available: boolean;
    error?: string;
  }>({ checked: false, available: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [showCartoonPicker, setShowCartoonPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size should be less than 10MB', 'warning');
      return;
    }

    try {
      const compressed = await compressAvatarImage(file, 256);
      setAvatarUrl(compressed);
      showToast('Profile photo selected!', 'info');
    } catch {
      showToast('Could not process this image format', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Adjust availability and checking state during render when typing
  const [prevUsername, setPrevUsername] = useState(username);
  if (username !== prevUsername) {
    setPrevUsername(username);
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setIsChecking(false);
      setAvailability({ checked: false, available: false });
    } else {
      const validation = validateUsername(trimmed);
      if (!validation.isValid) {
        setIsChecking(false);
        setAvailability({ checked: true, available: false, error: validation.error });
      } else {
        setIsChecking(true);
        setAvailability({ checked: false, available: false });
      }
    }
  }

  // Debounced username availability verification
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return;

    const validation = validateUsername(trimmed);
    if (!validation.isValid) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(trimmed);
        if (!cancelled) {
          if (result.available) {
            setAvailability({ checked: true, available: true });
          } else {
            setAvailability({ checked: true, available: false, error: 'Username is already taken.' });
          }
        }
      } catch {
        if (!cancelled) {
          setAvailability({ checked: true, available: false, error: 'Failed to verify username.' });
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability.available || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onboardUser(
        username.trim().toLowerCase(),
        displayName.trim() || undefined,
        avatarUrl || undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectLogin = async () => {
    if (!username.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await loginWithUsername(username.trim().toLowerCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSuggestion = (suggested: string) => {
    setUsername(suggested);
  };

  return (
    <div
      style={{ height: 'var(--app-height, 100dvh)', maxHeight: 'var(--app-height, 100dvh)' }}
      className="w-full bg-white flex flex-col justify-between p-3 sm:p-5 md:p-6 relative overflow-y-auto select-none"
    >
      {/* Background soft architectural accents */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-slate-50/70 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between w-full max-w-4xl mx-auto gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/25 flex-shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
          <div>
            <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
              MessMee
            </span>
            <span className="text-[9px] sm:text-[10px] text-indigo-600 font-semibold tracking-wide uppercase block">
              Pure Messaging
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsRecoveryOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 hover:text-indigo-600 font-medium py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition-all cursor-pointer shadow-sm flex-shrink-0"
        >
          <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
          <span>Restore Session</span>
        </button>
      </header>

      {/* Main Hero & Card */}
      <main className="w-full max-w-md mx-auto my-auto py-2 sm:py-4 flex-shrink-0">
        <div className="text-center mb-2.5 sm:mb-4">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-[10px] sm:text-[11px] font-semibold mb-1 sm:mb-1.5 shadow-xs">
            <Sparkles className="w-3 h-3 text-indigo-600 flex-shrink-0" />
            <span>Zero Passwords &bull; 100% Instant</span>
          </div>

          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Your conversations start here.
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mx-auto mt-0.5 leading-normal hidden xs:block">
            Choose your handle and jump straight into real-time chatting.
          </p>
        </div>

        {/* Floating Identity Setup Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/90 shadow-lg shadow-slate-200/40 relative">
          {/* Live Avatar Preview with Easy Photo Picker */}
          <div className="flex flex-col items-center justify-center mb-3 sm:mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to set profile photo"
            >
              <Avatar
                name={displayName || username || 'MessMee'}
                avatarUrl={avatarUrl}
                seed={username || 'guest'}
                size="lg"
                isOnline={true}
                className="ring-2 sm:ring-4 ring-indigo-50/80 transition-all group-hover:ring-indigo-200"
              />
              <div className="absolute inset-0 rounded-full bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold">
                <Camera className="w-3.5 h-3.5 mb-0.5" />
                <span>Upload</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors cursor-pointer ring-2 ring-white"
                title="Upload profile photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Upload className="w-2.5 h-2.5" />
                <span>{avatarUrl ? 'Upload Photo' : 'Upload Photo'}</span>
              </button>

              <span className="text-slate-300 text-[10px]">&bull;</span>

              <button
                type="button"
                onClick={() => setShowCartoonPicker((prev) => !prev)}
                className={`text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  showCartoonPicker ? 'text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                <span>{showCartoonPicker ? 'Hide Cartoons' : 'Pick Cartoon'}</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs text-rose-500 hover:text-rose-700 transition-colors cursor-pointer p-0.5 inline-flex items-center gap-0.5"
                  title="Remove avatar"
                >
                  <X className="w-3 h-3" />
                  <span className="text-[10px]">Clear</span>
                </button>
              )}
            </div>

            {showCartoonPicker && (
              <div className="w-full mt-2.5">
                <CuratedAvatarPicker
                  selectedAvatarUrl={avatarUrl}
                  onSelectAvatar={(uri) => {
                    setAvatarUrl(uri);
                    showToast('Cartoon avatar chosen', 'info');
                  }}
                />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Pick a Username
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Unique handle</span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                  @
                </span>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_handle"
                  maxLength={20}
                  className={`w-full pl-7 pr-9 py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white rounded-xl border text-slate-950 text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                    availability.checked
                      ? availability.available
                        ? 'border-emerald-300 focus:ring-emerald-400 focus:border-emerald-400'
                        : 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                      : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : availability.checked ? (
                    availability.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )
                  ) : null}
                </div>
              </div>

              {/* Live status feedback */}
              <div className="min-h-[18px] mt-1 px-1">
                {availability.checked && !isChecking && (
                  <div>
                    <p
                      className={`text-[11px] flex items-center gap-1 font-medium ${
                        availability.available ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {availability.available ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>@{username} is available!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{availability.error}</span>
                        </>
                      )}
                    </p>

                    {/* Instant Login option if username is already registered */}
                    {!availability.available && availability.error?.includes('taken') && (
                      <div className="mt-1.5 p-2 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-[10px] text-indigo-950 font-medium">
                          Account exists?
                        </span>
                        <button
                          type="button"
                          onClick={handleDirectLogin}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 flex-shrink-0"
                        >
                          {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          <span>Connect as @{username}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {!availability.checked && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>3 to 20 letters, numbers, and underscores</span>
                  </div>
                )}
              </div>

              {/* Quick suggestions if empty */}
              {!username && (
                <div className="flex items-center gap-1.5 mt-1 pt-0.5">
                  <span className="text-[10px] font-medium text-slate-400">Try:</span>
                  {['alex_craft', 'sarah_wave', 'ryan_flow'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleQuickSuggestion(sug)}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      @{sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Display Name
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={username ? `@${username}` : 'How friends will see you'}
                maxLength={30}
                className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!availability.available || isSubmitting || isChecking}
              className="w-full mt-2 py-2.5 sm:py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Enter MessMee</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Shield className="w-3 h-3 text-indigo-600 flex-shrink-0" />
            <span>Cryptographic local sessions protect your identity.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto flex items-center justify-between text-[10px] sm:text-xs text-slate-400 py-1 sm:py-1.5 border-t border-slate-100 flex-shrink-0">
        <p className="font-medium text-slate-600">
          MessMee &bull; Minimalist Messaging
        </p>
        <p className="text-slate-400">Lexend Typography &bull; Pure White</p>
      </footer>

      <SessionRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />
    </div>
  );
};
