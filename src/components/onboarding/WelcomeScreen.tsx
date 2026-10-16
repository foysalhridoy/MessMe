import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Loader2, Sparkles, Shield, Camera, Upload, X } from 'lucide-react';
import { checkUsernameAvailability } from '../../services/db';
import { validateUsername } from '../../lib/identity';
import { useChat } from '../../context/ChatContext';
import { SessionRecoveryModal } from './SessionRecoveryModal';
import { Avatar } from '../common/Avatar';
import { compressAvatarImage } from '../../lib/avatars';

export const WelcomeScreen: React.FC = () => {
  const { onboardUser, showToast } = useChat();
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

  // Debounced username availability verification
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setAvailability({ checked: false, available: false });
      return;
    }

    const validation = validateUsername(trimmed);
    if (!validation.isValid) {
      setAvailability({ checked: true, available: false, error: validation.error });
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(trimmed);
        if (result.available) {
          setAvailability({ checked: true, available: true });
        } else {
          setAvailability({ checked: true, available: false, error: 'Username is already taken.' });
        }
      } catch {
        setAvailability({ checked: true, available: false, error: 'Failed to verify username.' });
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
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

  const handleQuickSuggestion = (suggested: string) => {
    setUsername(suggested);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between p-3.5 sm:p-8 md:p-12 relative overflow-hidden select-none">
      {/* Background soft architectural accents */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-slate-50/80 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 flex-shrink-0">
            <MessageSquare className="w-4.5 h-4.5 sm:w-6 sm:h-6 fill-current" />
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 block leading-none">
              MessMe
            </span>
            <span className="text-[10px] sm:text-xs text-indigo-600 font-semibold tracking-wide uppercase mt-0.5 block">
              Pure Messaging
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsRecoveryOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-slate-600 hover:text-indigo-600 font-medium py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all cursor-pointer shadow-sm shadow-slate-100 flex-shrink-0"
        >
          <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
          <span>Restore Session</span>
        </button>
      </header>

      {/* Main Hero & Card */}
      <main className="w-full max-w-lg mx-auto my-auto py-4 sm:py-10">
        <div className="text-center mb-5 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-[11px] sm:text-xs font-semibold mb-2.5 sm:mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
            <span>Zero Passwords &bull; 100% Instant</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.18] mb-2.5 sm:mb-4">
            Your conversations start here.
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-slate-600 max-w-md mx-auto leading-relaxed font-normal">
            Pick a unique username and jump straight into real-time chatting with text, emoji, voice notes, and reactions.
          </p>
        </div>

        {/* Floating Identity Setup Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/40 relative">
          {/* Live Avatar Preview with Easy Photo Picker */}
          <div className="flex flex-col items-center justify-center mb-6">
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
                name={displayName || username || 'MessMe'}
                avatarUrl={avatarUrl}
                seed={username || 'guest'}
                size="xl"
                isOnline={true}
                className="ring-4 ring-indigo-50/80 transition-all group-hover:ring-indigo-200"
              />
              <div className="absolute inset-0 rounded-full bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold">
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors cursor-pointer ring-2 ring-white"
                title="Upload profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>{avatarUrl ? 'Change Photo' : 'Add Profile Picture (Optional)'}</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs text-rose-500 hover:text-rose-700 transition-colors cursor-pointer p-0.5"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pick a Unique Username
                </label>
                <span className="text-xs text-slate-400 font-medium">Global identifier</span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                  @
                </span>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_handle"
                  maxLength={20}
                  className={`w-full pl-9 pr-11 py-3.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white rounded-2xl border text-slate-950 text-base font-semibold transition-all focus:outline-none focus:ring-2 ${
                    availability.checked
                      ? availability.available
                        ? 'border-emerald-300 focus:ring-emerald-400 focus:border-emerald-400'
                        : 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                      : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />

                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : availability.checked ? (
                    availability.available ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    )
                  ) : null}
                </div>
              </div>

              {/* Live status feedback */}
              <div className="min-h-[24px] mt-2 px-1">
                {availability.checked && !isChecking && (
                  <p
                    className={`text-xs flex items-center gap-1.5 font-medium ${
                      availability.available ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {availability.available ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>@{username} is available! Ready to create.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>{availability.error}</span>
                      </>
                    )}
                  </p>
                )}
                {!availability.checked && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>3 to 20 letters, numbers, and underscores.</span>
                  </div>
                )}
              </div>

              {/* Quick suggestions if empty */}
              {!username && (
                <div className="flex items-center gap-2 mt-2 pt-1">
                  <span className="text-[11px] font-medium text-slate-400">Try:</span>
                  {['alex_craft', 'sarah_wave', 'ryan_flow'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleQuickSuggestion(sug)}
                      className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      @{sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Display Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={username ? `@${username}` : 'How friends will see you'}
                maxLength={30}
                className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white rounded-2xl border border-slate-200 text-slate-900 text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!availability.available || isSubmitting || isChecking}
              className="w-full mt-3 py-4 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  <span>Enter MessMe</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span>Cryptographic local sessions protect your identity.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 py-3 gap-2 border-t border-slate-100">
        <p className="font-medium text-slate-600">
          MessMe &bull; A Distinctive Minimalist Messaging Experience
        </p>
        <p className="text-slate-400">Lexend Typography &bull; White Palette Only</p>
      </footer>

      <SessionRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />
    </div>
  );
};
