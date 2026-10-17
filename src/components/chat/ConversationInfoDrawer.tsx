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
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { useChat } from '../../context/useChat';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../lib/presence';
import { requestNotificationPermission, getNotificationPermission } from '../../lib/notifications';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import type { Message } from '../../types';

interface ConversationInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type MediaTab = 'all' | 'photos' | 'voice';

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
  const [selectedImage, setSelectedImage] = useState<{ url: string; sender?: string; date?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<MediaTab>('photos');

  if (!isOpen || !activeConversation) return null;

  // Always bind to the live conversation in state so pin/mute changes reflect in real-time
  const liveConv = conversations.find((c) => c.id === activeConversation.id) || activeConversation;
  const isPinned = Boolean(liveConv.isPinned);
  const isMuted = Boolean(liveConv.isMuted);

  const contact = liveConv.otherParticipant;

  // Robust detection for voice notes
  const isVoiceMessage = (m: Message): boolean => {
    if (m.isDeleted) return false;
    return (
      m.type === 'voice' ||
      Boolean(m.duration) ||
      Boolean(
        m.mediaUrl &&
          (m.mediaUrl.includes('audio') ||
            m.mediaUrl.endsWith('.webm') ||
            m.mediaUrl.endsWith('.mp3') ||
            m.mediaUrl.endsWith('.ogg') ||
            m.mediaUrl.endsWith('.wav'))
      )
    );
  };

  // Robust detection for shared photos
  const getMessageImage = (m: Message): string | null => {
    if (m.isDeleted) return null;
    if (m.imageUrl) return m.imageUrl;
    if (
      m.type !== 'voice' &&
      !m.duration &&
      m.mediaUrl &&
      (m.mediaUrl.startsWith('data:image') ||
        m.mediaUrl.startsWith('http') ||
        m.mediaUrl.startsWith('blob:') ||
        m.content === 'Shared an image')
    ) {
      return m.mediaUrl;
    }
    return null;
  };

  const voiceNotes = activeMessages.filter(isVoiceMessage);
  const sharedImages = activeMessages
    .map((m) => ({ msg: m, url: getMessageImage(m) }))
    .filter((item): item is { msg: Message; url: string } => Boolean(item.url));

  const totalMedia = sharedImages.length + voiceNotes.length;

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

      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] xl:static xl:z-30 xl:w-[420px] xl:flex-shrink-0 bg-white border-l border-slate-200/90 flex flex-col shadow-2xl xl:shadow-none animate-in slide-in-from-right duration-200 select-none h-full max-h-screen">
        {/* Sticky Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Conversation Info</h4>
            {totalMedia > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                {totalMedia} media
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container for all content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-100/90 pb-10 overscroll-contain">
          {/* Profile summary - clean and proportional */}
          <div className="p-5 text-center bg-gradient-to-b from-slate-50/60 to-white">
            <Avatar
              name={contact.displayName || contact.username}
              avatarUrl={contact.avatarUrl}
              seed={contact.username}
              size="lg"
              isOnline={contact.isOnline}
              className="mx-auto mb-3 ring-4 ring-indigo-50/80 shadow-xs"
            />
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate tracking-tight">
              {contact.displayName || contact.username}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-600 font-semibold mt-0.5">@{contact.username}</p>

            {/* Activity Status Badge */}
            <div className="mt-2 flex items-center justify-center">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
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
              <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                {contact.about}
              </p>
            )}
          </div>

          {/* Quick preferences / Chat Settings */}
          <div className="p-4 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
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

          {/* DEDICATED MEDIA & VOICE HUB: Right below Pin & Mute options with ample, proper space */}
          <div className="p-4 space-y-3.5 bg-slate-50/40">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Shared Media & Audio</span>
                </h5>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Photos and voice recordings in this chat
                </p>
              </div>
            </div>

            {/* Interactive Segmented Tabs with Counters */}
            <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'photos'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {sharedImages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'voice'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {voiceNotes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'all'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {totalMedia}
                </span>
              </button>
            </div>

            {/* TAB CONTENT: Generous viewing space */}
            <div className="min-h-[220px]">
              {/* --- PHOTOS VIEW --- */}
              {(activeTab === 'photos' || activeTab === 'all') && (
                <div className="space-y-3">
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-indigo-500" />
                        Photos ({sharedImages.length})
                      </span>
                    </div>
                  )}

                  {sharedImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {sharedImages.map(({ msg, url }) => (
                        <div
                          key={msg.id}
                          onClick={() =>
                            setSelectedImage({
                              url,
                              sender: msg.senderUsername,
                              date: new Date(msg.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                            })
                          }
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer bg-slate-100 ring-2 ring-transparent hover:ring-indigo-500/30"
                        >
                          <img
                            src={url}
                            alt="Shared media"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          {/* Hover Overlay with Preview Icon */}
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex flex-col items-center justify-center p-1.5">
                            <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            <span className="text-[10px] text-white/90 font-semibold opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-full mt-1">
                              @{msg.senderUsername}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    activeTab === 'photos' && (
                      <div className="py-8 px-4 rounded-2xl bg-white border border-slate-200/70 text-center shadow-xs">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2.5">
                          <ImageIcon className="w-6 h-6 stroke-[1.8]" />
                        </div>
                        <h6 className="text-xs font-bold text-slate-700">No photos shared yet</h6>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                          Photos sent or received in this chat will be organized here with high-resolution preview.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* --- VOICE NOTES VIEW --- */}
              {(activeTab === 'voice' || activeTab === 'all') && (
                <div className={`space-y-2.5 ${activeTab === 'all' ? 'pt-4' : ''}`}>
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mic className="w-3 h-3 text-indigo-500" />
                        Voice Notes ({voiceNotes.length})
                      </span>
                    </div>
                  )}

                  {voiceNotes.length > 0 ? (
                    <div className="space-y-2.5">
                      {voiceNotes.map((vn) => {
                        const isFromSender = vn.senderId !== contact.userId;
                        return (
                          <div
                            key={vn.id}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 shadow-xs hover:shadow-sm transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isFromSender ? 'bg-indigo-500' : 'bg-emerald-500'
                                  }`}
                                />
                                @{vn.senderUsername}
                                {isFromSender && (
                                  <span className="text-[10px] font-normal text-slate-400">(You)</span>
                                )}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(vn.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <VoiceMessagePlayer
                              mediaUrl={vn.mediaUrl}
                              duration={vn.duration}
                              isSender={isFromSender}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    activeTab === 'voice' && (
                      <div className="py-8 px-4 rounded-2xl bg-white border border-slate-200/70 text-center shadow-xs">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2.5">
                          <Mic className="w-6 h-6 stroke-[1.8]" />
                        </div>
                        <h6 className="text-xs font-bold text-slate-700">No voice notes recorded</h6>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                          Voice audio clips recorded in this conversation will be listed here with full playback controls.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Empty state when 'all' tab is selected but nothing shared */}
              {activeTab === 'all' && totalMedia === 0 && (
                <div className="py-8 px-4 rounded-2xl bg-white border border-slate-200/70 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2.5">
                    <Layers className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h6 className="text-xs font-bold text-slate-700">No media in this chat yet</h6>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Photos and voice notes exchanged with @{contact.username} will be organized here.
                  </p>
                </div>
              )}
            </div>
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
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* Top toolbar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between pb-3 px-2 text-white select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {selectedImage.sender && (
                <p className="text-sm font-bold text-white">@{selectedImage.sender}</p>
              )}
              {selectedImage.date && (
                <p className="text-xs text-white/70">{selectedImage.date}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={selectedImage.url}
                download={`messme-photo-${Date.now()}.png`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-lg"
                title="Download photo"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer shadow-lg"
                aria-label="Close image preview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div
            className="relative flex items-center justify-center max-w-4xl max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt="Full size shared media"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </>
  );
};

