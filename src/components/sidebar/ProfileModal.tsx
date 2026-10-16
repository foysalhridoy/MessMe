import { useState, useRef } from 'react';
import { Camera, Trash2, Copy, Check, KeyRound, LogOut, ShieldCheck, Sparkles, Upload, Loader2, Ban } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { PRESET_AVATARS, compressAvatarImage } from '../../lib/avatars';
import { useChat } from '../../context/ChatContext';
import { getStoredUserById } from '../../services/db';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    session,
    updateCurrentUserProfile,
    logoutUser,
    showToast,
    blockedUserIds,
    unblockUser,
  } = useChat();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isCopiedToken, setIsCopiedToken] = useState(false);
  const [isCopiedUserId, setIsCopiedUserId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

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
      showToast('Profile picture preview ready', 'info');
    } catch {
      showToast('Could not process this image format', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    showToast('Photo removed, default avatar restored', 'info');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentUserProfile(displayName, avatarUrl, about);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: 'token' | 'userId') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setIsCopiedToken(true);
      setTimeout(() => setIsCopiedToken(false), 2000);
      showToast('Session backup key copied to clipboard', 'success');
    } else {
      setIsCopiedUserId(true);
      setTimeout(() => setIsCopiedUserId(false), 2000);
      showToast('Internal User ID copied', 'info');
    }
  };

  const isCustomPhoto = Boolean(avatarUrl && avatarUrl.startsWith('data:image'));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile & Picture"
      description="Customize your public persona and profile photo on MessMe."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile Picture Upload & Preview Card */}
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/90 rounded-3xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Avatar with Camera Overlay */}
          <div className="relative group cursor-pointer flex-shrink-0 w-[88px] h-[88px]" onClick={() => fileInputRef.current?.click()}>
            <Avatar
              name={displayName || currentUser.username}
              avatarUrl={avatarUrl}
              seed={currentUser.username}
              size="xl"
              isOnline={true}
              className="ring-4 ring-white shadow-md"
            />
            {/* Camera badge */}
            <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold">
              <Camera className="w-5 h-5 mb-0.5" />
              <span>Change</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors cursor-pointer ring-2 ring-white"
              title="Upload photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action buttons for profile picture */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h4 className="text-lg font-extrabold text-slate-900 truncate">
              {displayName || currentUser.username}
            </h4>
            <p className="text-sm font-semibold text-indigo-600 mb-3">@{currentUser.username}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white text-indigo-600 hover:bg-indigo-50 border border-slate-200/90 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Picture</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-200/60 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              JPG, PNG, GIF or WebP. Max size: 5MB.
            </p>
          </div>
        </div>

        {/* Preset Gradients (if user prefers an illustrated avatar) */}
        {!isCustomPhoto && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Pick a Curated Avatar Theme
              </label>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Color style
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarUrl(av.gradient)}
                  className={`w-10 h-10 rounded-full ${av.gradient} text-white text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
                    avatarUrl === av.gradient
                      ? 'ring-3 ring-indigo-600 scale-110 shadow-md'
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  title={av.name}
                >
                  {av.iconText}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Display Name & Bio Edit Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How others see your name"
              maxLength={35}
              className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              About / Bio
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="e.g. Always online &bull; Minimalist designer ✨"
              maxLength={80}
              className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-normal"
            />
          </div>
        </div>

        {/* Cryptographic Session & Identity Recovery Info */}
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Internal Stable UUID</span>
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(currentUser.id, 'userId')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 font-medium bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-colors flex-shrink-0"
            >
              <span>{currentUser.id.substring(0, 12)}...</span>
              {isCopiedUserId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {session?.sessionToken && (
            <div className="pt-3 border-t border-slate-200/70">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                  <KeyRound className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">Session Backup Key</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(session.sessionToken, 'token')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/60 shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  {isCopiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Save this key if you want to restore this identity and all message history on another browser.
              </p>
            </div>
          )}
        </div>

        {/* Blocked Accounts Section */}
        {blockedUserIds.length > 0 && (
          <div className="p-4 sm:p-5 bg-rose-50/40 border border-rose-200/70 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Ban className="w-4 h-4 text-rose-500" />
                <span>Blocked Accounts ({blockedUserIds.length})</span>
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {blockedUserIds.map((bId) => {
                const u = getStoredUserById(bId);
                const name = u?.displayName || u?.username || `User #${bId.substring(0, 6)}`;
                const handle = u?.username ? `@${u.username}` : '';
                return (
                  <div
                    key={bId}
                    className="p-2.5 bg-white border border-rose-100 rounded-xl flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        name={name}
                        avatarUrl={u?.avatarUrl}
                        seed={u?.username || bId}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">{name}</span>
                        {handle && <span className="text-[11px] text-slate-400 block truncate">{handle}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockUser(bId)}
                      className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear session on this browser? Make sure you backed up your key.')) {
                logoutUser();
                onClose();
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3.5 py-2.5 rounded-xl border border-rose-200/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account</span>
          </button>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save Profile</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
