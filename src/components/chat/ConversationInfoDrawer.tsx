import React, { useState } from 'react';
import { X, Pin, VolumeX, Trash2, Mic, Image as ImageIcon, Ban, Bell, Check } from 'lucide-react';
import { useChat } from '../../context/useChat';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../lib/presence';
import { requestNotificationPermission, getNotificationPermission } from '../../lib/notifications';

interface ConversationInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationInfoDrawer: React.FC<ConversationInfoDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeConversation,
    conversations,
    activeMessages,
    togglePin,
    toggleMute,
    clearConversation,
    blockUser,
    unblockUser,
    isBlocked,
    showToast,
  } = useChat();

  const [notifPermission, setNotifPermission] = useState(getNotificationPermission);

  if (!isOpen || !activeConversation) return null;

  // Always bind to the live conversation in state so pin/mute changes reflect in real-time
  const liveConv = conversations.find((c) => c.id === activeConversation.id) || activeConversation;
  const isPinned = Boolean(liveConv.isPinned);
  const isMuted = Boolean(liveConv.isMuted);

  const contact = liveConv.otherParticipant;
  const voiceNotes = activeMessages.filter((m) => m.type === 'voice' && !m.isDeleted);
  const sharedImages = activeMessages.filter((m) => Boolean(m.imageUrl) && !m.isDeleted);

  const handleEnableBackgroundAlerts = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(getNotificationPermission());
    if (granted) {
      showToast('Background notifications enabled! You will hear sounds even when website is minimized.', 'success');
    } else {
      showToast('Notification permission was not granted by your browser.', 'info');
    }
  };

  return (
    <>
      {/* Backdrop for mobile & tablet (< xl) */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 xl:hidden animate-fade-in"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-88 md:w-96 xl:static xl:z-30 bg-white border-l border-slate-200/90 flex flex-col shadow-2xl xl:shadow-none animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-18 px-5 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Conversation Info</h4>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile summary */}
      <div className="p-7 text-center border-b border-slate-100">
        <Avatar
          name={contact.displayName || contact.username}
          avatarUrl={contact.avatarUrl}
          seed={contact.username}
          size="xl"
          isOnline={contact.isOnline}
          className="mx-auto mb-3.5 ring-4 ring-indigo-50/70"
        />
        <h3 className="text-lg font-extrabold text-slate-900 truncate tracking-tight">
          {contact.displayName || contact.username}
        </h3>
        <p className="text-sm text-indigo-600 font-semibold mt-0.5">@{contact.username}</p>

        {/* Activity Status Badge */}
        <div className="mt-2.5 flex items-center justify-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              contact.isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                : 'bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            {contact.isOnline && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span>{formatLastSeen(contact.lastSeen, contact.isOnline)}</span>
          </span>
        </div>

        {isBlocked(contact.userId) && (
          <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
            Blocked Contact
          </span>
        )}

        {contact.about && (
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {contact.about}
          </p>
        )}
      </div>

      {/* Quick preferences */}
      <div className="p-4 border-b border-slate-100 space-y-2">
        {/* Pin Conversation Button */}
        <button
          onClick={() => togglePin(liveConv.id)}
          className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
            isPinned
              ? 'bg-indigo-50/80 hover:bg-indigo-100/70 border-indigo-200/80 text-indigo-950'
              : 'hover:bg-slate-50 text-slate-700 border-transparent'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Pin
              className={`w-4 h-4 transition-transform duration-200 ${
                isPinned ? 'text-indigo-600 fill-indigo-600 rotate-45' : 'text-slate-400'
              }`}
            />
            <span className="font-semibold text-sm">Pin Conversation</span>
          </span>
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-colors ${
                isPinned
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isPinned ? 'Pinned' : 'Off'}
            </span>
            {/* iOS-grade toggle switch */}
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                isPinned ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  isPinned ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </button>

        {/* Mute Notifications Button */}
        <button
          onClick={() => toggleMute(liveConv.id)}
          className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
            isMuted
              ? 'bg-amber-50/80 hover:bg-amber-100/70 border-amber-200/80 text-amber-950'
              : 'hover:bg-slate-50 text-slate-700 border-transparent'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <VolumeX
              className={`w-4 h-4 transition-colors ${
                isMuted ? 'text-amber-600 stroke-[2.2]' : 'text-slate-400'
              }`}
            />
            <span className="font-semibold text-sm">Mute Notifications</span>
          </span>
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-colors ${
                isMuted
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isMuted ? 'Muted' : 'Off'}
            </span>
            {/* iOS-grade toggle switch */}
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                isMuted ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  isMuted ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </button>

        {/* Background Alerts Status & Toggle */}
        <button
          onClick={handleEnableBackgroundAlerts}
          className="w-full flex items-center justify-between p-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors text-xs text-slate-600 font-medium cursor-pointer"
          title="Play notification sound & banner when website is minimized or in another tab"
        >
          <span className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            <span>Background Alerts</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-[11px] text-slate-500">
            {notifPermission === 'granted' ? (
              <span className="text-emerald-600 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3 stroke-[3]" /> Active
              </span>
            ) : (
              <span className="text-indigo-600 hover:underline">Tap to Enable</span>
            )}
          </span>
        </button>
      </div>

      {/* Shared Media Tabs & Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Shared Photos */}
        {sharedImages.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Shared Photos ({sharedImages.length})
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {sharedImages.map((img) => (
                <img
                  key={img.id}
                  src={img.imageUrl}
                  alt="Shared media"
                  className="w-full h-20 object-cover rounded-xl border border-slate-200 hover:opacity-90 cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        {/* Shared Voice Notes */}
        <div>
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Notes ({voiceNotes.length})
          </h5>

          {voiceNotes.length > 0 ? (
            <div className="space-y-2">
              {voiceNotes.map((vn) => (
                <div
                  key={vn.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      From @{vn.senderUsername}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Duration: {vn.duration || 4}s &bull;{' '}
                      {new Date(vn.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2">No voice notes shared yet</p>
          )}
        </div>
      </div>

      {/* Bottom Danger actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={() => {
            if (isBlocked(contact.userId)) {
              unblockUser(contact.userId);
            } else {
              if (window.confirm(`Are you sure you want to block @${contact.username}? You will not be able to send or receive messages from this user.`)) {
                blockUser(contact.userId);
              }
            }
          }}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-2xl transition-all cursor-pointer border ${
            isBlocked(contact.userId)
              ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200/60'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>{isBlocked(contact.userId) ? `Unblock @${contact.username}` : `Block @${contact.username}`}</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all messages in this conversation?')) {
              clearConversation(activeConversation.id);
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-2xl transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Conversation History</span>
        </button>
      </div>
    </aside>
    </>
  );
};
