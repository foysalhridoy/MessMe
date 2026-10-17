import { ArrowLeft, Search, Info } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/useChat';
import { formatLastSeen } from '../../lib/presence';

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

  if (!activeConversation) return null;

  const contact = activeConversation.otherParticipant;
  const isTyping = Boolean(
    typingMap[activeConversation.id] &&
    contact?.username &&
    typingMap[activeConversation.id]?.toLowerCase() === contact.username.toLowerCase()
  );
  const userBlocked = isBlocked(contact.userId);

  return (
    <div className="h-16 px-4 sm:px-5 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2.5 sm:gap-4 select-none flex-shrink-0 z-20">
      <div
        onClick={onToggleInfo}
        className="flex items-center gap-3 min-w-0 cursor-pointer group py-1 px-1.5 -ml-1.5 rounded-xl hover:bg-slate-50/80 transition-all"
        title="View details"
      >
        {/* Mobile Back Button with generous 40px touch target */}
        {onBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center text-slate-700 hover:text-slate-900 active:bg-slate-200/80 rounded-xl active:scale-95 transition-all cursor-pointer flex-shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
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
              <span className="text-[11px] sm:text-xs text-indigo-600 font-semibold flex items-center gap-1.5 leading-none">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-3" />
                </span>
                typing...
              </span>
            ) : contact.isOnline ? (
              <span className="text-[11px] sm:text-xs text-emerald-600 font-medium leading-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active now
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs text-slate-400 font-normal leading-none">
                {formatLastSeen(contact.lastSeen, false)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5">
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
    </div>
  );
};
