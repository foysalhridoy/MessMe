import React, { useState } from 'react';
import {
  X,
  Pin,
  VolumeX,
  Trash2,
  Mic,
  Image as ImageIcon,
  Ban,
  Bell,
  Check,
  Maximize2,
} from 'lucide-react';
import { useChat } from '../../context/useChat';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../lib/presence';
import { requestNotificationPermission, getNotificationPermission } from '../../lib/notifications';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 xl:hidden animate-fade-in"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-88 md:w-96 xl:static xl:z-30 bg-white border-l border-slate-200/90 flex flex-col shadow-2xl xl:shadow-none animate-in slide-in-from-right duration-200 select-none h-full max-h-screen">
        {/* Sticky Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Conversation Info</h4>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container for all content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-100/90 pb-8 overscroll-contain">
          {/* Profile summary */}
          <div className="p-6 text-center">
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
              <p className="text-xs sm:text-sm text-slate-600 mt-3.5 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left">
                {contact.about}
              </p>
            )}
          </div>

          {/* Quick preferences */}
          <div className="p-4 space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
              Chat Settings
            </h5>

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

          {/* Shared Photos Section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>Shared Photos</span>
              </h5>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {sharedImages.length}
              </span>
            </div>

            {sharedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {sharedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img.imageUrl || null)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer bg-slate-100"
                  >
                    <img
                      src={img.imageUrl}
                      alt="Shared media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <ImageIcon className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">No photos shared in this chat yet</p>
              </div>
            )}
          </div>

          {/* Shared Voice Notes Section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                <span>Voice Notes</span>
              </h5>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {voiceNotes.length}
              </span>
            </div>

            {voiceNotes.length > 0 ? (
              <div className="space-y-2.5">
                {voiceNotes.map((vn) => (
                  <div
                    key={vn.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200/90 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">
                        @{vn.senderUsername}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                        {new Date(vn.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <VoiceMessagePlayer
                      mediaUrl={vn.mediaUrl}
                      duration={vn.duration}
                      isSender={vn.senderId !== contact.userId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Mic className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">No voice notes recorded yet</p>
              </div>
            )}
          </div>

          {/* Bottom Danger actions */}
          <div className="p-4 space-y-2.5 pt-5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Privacy & Actions
            </h5>

            <button
              onClick={() => {
                if (isBlocked(contact.userId)) {
                  unblockUser(contact.userId);
                } else {
                  if (
                    window.confirm(
                      `Are you sure you want to block @${contact.username}? You will not be able to send or receive messages from this user.`
                    )
                  ) {
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
        </div>
      </aside>

      {/* Full-screen Lightbox Modal for Shared Photos */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer shadow-lg"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Full size shared media"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
