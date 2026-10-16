import { useState } from 'react';
import { ArrowLeft, Search, Info, Timer } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { DisappearingMessagesModal } from './DisappearingMessagesModal';

interface ChatHeaderProps {
  onBack?: () => void;
  onToggleInfo: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  onToggleInfo,
  onToggleSearch,
  isSearchOpen,
}) => {
  const { activeConversation, typingMap, isBlocked } = useChat();
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  if (!activeConversation) return null;

  const contact = activeConversation.otherParticipant;
  const isTyping = Boolean(typingMap[activeConversation.id]);
  const disappearingDuration = activeConversation.disappearingDuration || 'off';
  const userBlocked = isBlocked(contact.userId);

  return (
    <div className="h-16 px-4 sm:px-5 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2.5 sm:gap-4 select-none flex-shrink-0 z-20">
      <div
        onClick={onToggleInfo}
        className="flex items-center gap-3 min-w-0 cursor-pointer group py-1 px-1.5 -ml-1.5 rounded-xl hover:bg-slate-50/80 transition-all"
        title="View details"
      >
        {/* Mobile Back Button */}
        {onBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Contact Avatar & presence */}
        <Avatar
          name={contact.displayName || contact.username}
          avatarUrl={contact.avatarUrl}
          seed={contact.username}
          size="md"
          isOnline={userBlocked ? false : contact.isOnline}
        />

        {/* User Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13.5px] sm:text-[15px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight">
              {contact.displayName || contact.username}
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-400 font-normal truncate hidden sm:inline">
              @{contact.username}
            </span>
            {userBlocked && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-md">
                Blocked
              </span>
            )}
          </div>

          <div className="flex items-center mt-0.5">
            {userBlocked ? (
              <span className="text-[11px] sm:text-xs text-rose-500 font-medium leading-none">
                Blocked user
              </span>
            ) : isTyping ? (
              <span className="text-[11px] sm:text-xs text-indigo-600 font-medium flex items-center gap-1.5 leading-none animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                typing...
              </span>
            ) : contact.isOnline ? (
              <span className="text-[11px] sm:text-xs text-emerald-600 font-medium leading-none">
                Active now
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs text-slate-400 font-normal leading-none">
                {contact.lastSeen || 'Offline'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsTimerModalOpen(true)}
          className={`h-9 px-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold ${
            disappearingDuration !== 'off'
              ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-300 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Disappearing messages settings"
          aria-label="Disappearing messages"
        >
          <Timer className="w-4 h-4 stroke-[2]" />
          <span className="hidden sm:inline">
            {disappearingDuration !== 'off' ? disappearingDuration.toUpperCase() : ''}
          </span>
        </button>

        <button
          onClick={onToggleSearch}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isSearchOpen
              ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Search messages in this conversation"
          aria-label="Search conversation"
        >
          <Search className="w-4 h-4 stroke-[2]" />
        </button>

        <button
          onClick={onToggleInfo}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          title="View profile & shared media"
          aria-label="Conversation details"
        >
          <Info className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      <DisappearingMessagesModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />
    </div>
  );
};
