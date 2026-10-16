import { useState } from 'react';
import { X, Pin, VolumeX, Trash2, Mic, Image as ImageIcon, Timer, Ban } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { DisappearingMessagesModal } from './DisappearingMessagesModal';

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
    activeMessages,
    togglePin,
    toggleMute,
    clearConversation,
    blockUser,
    unblockUser,
    isBlocked,
  } = useChat();
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);

  if (!isOpen || !activeConversation) return null;

  const contact = activeConversation.otherParticipant;
  const voiceNotes = activeMessages.filter((m) => m.type === 'voice' && !m.isDeleted);
  const sharedImages = activeMessages.filter((m) => Boolean(m.imageUrl) && !m.isDeleted);

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
          className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
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
      <div className="p-4 border-b border-slate-100 space-y-1.5">
        <button
          onClick={() => togglePin(activeConversation.id)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Pin className="w-4 h-4 text-slate-500" />
            Pin Conversation
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
              activeConversation.isPinned
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : 'text-slate-400'
            }`}
          >
            {activeConversation.isPinned ? 'Pinned' : 'Off'}
          </span>
        </button>

        <button
          onClick={() => toggleMute(activeConversation.id)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <VolumeX className="w-4 h-4 text-slate-500" />
            Mute Notifications
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
              activeConversation.isMuted
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'text-slate-400'
            }`}
          >
            {activeConversation.isMuted ? 'Muted' : 'Off'}
          </span>
        </button>

        <button
          onClick={() => setIsDisappearingModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Timer className="w-4 h-4 text-slate-500" />
            Disappearing Messages
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
              activeConversation.disappearingDuration && activeConversation.disappearingDuration !== 'off'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-400'
            }`}
          >
            {activeConversation.disappearingDuration === '24h'
              ? '24 Hours'
              : activeConversation.disappearingDuration === '48h'
              ? '48 Hours'
              : 'Off'}
          </span>
        </button>
      </div>

      <DisappearingMessagesModal
        isOpen={isDisappearingModalOpen}
        onClose={() => setIsDisappearingModalOpen(false)}
      />

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
