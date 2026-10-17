import { useState } from 'react';
import { Pin, VolumeX, MoreVertical, Trash2, CheckCheck } from 'lucide-react';
import type { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/useChat';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
}

function formatConversationTime(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
}) => {
  const { currentUser, togglePin, toggleMute, clearConversation, typingMap, isBlocked } = useChat();
  const [showMenu, setShowMenu] = useState(false);

  const contact = conversation.otherParticipant;
  const isTyping = Boolean(
    contact?.username &&
    typingMap[conversation.id] &&
    typingMap[conversation.id]?.toLowerCase() === contact.username.toLowerCase()
  );
  const userBlocked = isBlocked(contact.userId);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
        isActive
          ? 'bg-indigo-50/80 border border-indigo-200/70 shadow-sm'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      {/* Contact Avatar */}
      <Avatar
        name={contact.displayName || contact.username}
        avatarUrl={contact.avatarUrl}
        seed={contact.username}
        size="md"
        isOnline={userBlocked ? false : contact.isOnline}
      />

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-[13.5px] sm:text-[15px] truncate font-semibold ${
                isActive ? 'text-indigo-950 font-bold' : 'text-slate-900'
              }`}
            >
              {contact.displayName || contact.username}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-normal truncate hidden sm:inline">
              @{contact.username}
            </span>
            {userBlocked && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded">
                Blocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] sm:text-xs font-medium text-slate-400">
            {conversation.isPinned && <Pin className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/30" />}
            {conversation.isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{formatConversationTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
          </div>
        </div>

        {/* Message preview & unread badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12.5px] sm:text-sm truncate text-slate-500 flex-1 leading-normal flex items-center gap-1 min-w-0">
            {isTyping ? (
              <span className="text-indigo-600 font-semibold flex items-center gap-1.5">
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-500 typing-dot-1" />
                  <span className="w-1 h-1 rounded-full bg-indigo-500 typing-dot-2" />
                  <span className="w-1 h-1 rounded-full bg-indigo-500 typing-dot-3" />
                </span>
                typing...
              </span>
            ) : conversation.lastMessage ? (
              <span className="flex items-center gap-1.5 truncate">
                {currentUser && conversation.lastMessage.senderId === currentUser.id && (
                  <span className="inline-flex items-center text-indigo-500 flex-shrink-0">
                    <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                )}
                {conversation.lastMessage.type === 'voice' ? (
                  <span className="italic text-slate-700 font-medium flex items-center gap-1">
                    🎙️ Voice note ({conversation.lastMessage.duration || 4}s)
                  </span>
                ) : conversation.lastMessage.imageUrl ? (
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    📷 Photo attachment
                  </span>
                ) : (
                  <span className="truncate">{conversation.lastMessage.content}</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">No messages yet</span>
            )}
          </div>

          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-indigo-600 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Quick options menu trigger */}
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer"
            aria-label="Conversation options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-7 z-40 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 animate-in fade-in zoom-in-95 text-xs text-slate-700">
                <button
                  onClick={() => {
                    togglePin(conversation.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Pin className="w-4 h-4 text-slate-500" />
                  {conversation.isPinned ? 'Unpin Conversation' : 'Pin to Top'}
                </button>
                <button
                  onClick={() => {
                    toggleMute(conversation.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  {conversation.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Clear all messages in this conversation?')) {
                      clearConversation(conversation.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Clear Message History
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
