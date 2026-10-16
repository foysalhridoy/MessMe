import { useState } from 'react';
import { CheckCheck, CornerDownRight, Timer } from 'lucide-react';
import type { Message } from '../../types';
import { Avatar } from '../common/Avatar';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { MessageActionsMenu } from './MessageActionsMenu';
import { isOnlyEmojis } from '../../lib/emojis';
import { useChat } from '../../context/ChatContext';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  showSenderHeader: boolean;
  onScrollToMessage: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSender,
  showSenderHeader,
  onScrollToMessage,
}) => {
  const { currentUser, reactToMessage, editUserMessage } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await editUserMessage(message.id, editContent.trim());
    setIsEditing(false);
  };

  // Convert plain URLs to clickable links
  const renderMessageContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all [overflow-wrap:anywhere] font-medium hover:opacity-90 inline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const isEmojiOnly = message.type === 'text' && isOnlyEmojis(message.content);

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col mb-2 sm:mb-2.5 transition-all w-full min-w-0 max-w-full ${
        isSender ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for received messages */}
      {showSenderHeader && !isSender && (
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 ml-9 sm:ml-10 mb-1">
          {message.senderDisplayName || message.senderUsername}
        </span>
      )}

      <div
        className={`flex items-end gap-1.5 sm:gap-2.5 max-w-[88%] sm:max-w-[78%] md:max-w-[68%] min-w-0 ${
          isSender ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar for sender or receiver */}
        <div className="w-7 sm:w-8 flex-shrink-0">
          {showSenderHeader ? (
            <Avatar
              name={
                isSender
                  ? (currentUser?.displayName || currentUser?.username || 'You')
                  : (message.senderDisplayName || message.senderUsername)
              }
              avatarUrl={
                isSender
                  ? (currentUser?.avatarUrl || message.senderAvatarUrl)
                  : message.senderAvatarUrl
              }
              seed={isSender ? currentUser?.username : message.senderUsername}
              size="sm"
            />
          ) : (
            <div className="w-7 sm:w-8" />
          )}
        </div>

        {/* Message Container */}
        <div className="relative group/bubble flex flex-col min-w-0 max-w-full">
          {/* Quoted Reply reference preview if message was a reply */}
          {message.replyTo && (
            <div
              onClick={() => onScrollToMessage(message.replyTo!.id)}
              className={`mb-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs cursor-pointer transition-all border flex items-center gap-2 max-w-full min-w-0 overflow-hidden ${
                isSender
                  ? 'bg-indigo-50 border-indigo-200/80 text-indigo-950 hover:bg-indigo-100'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/80'
              }`}
              title="Click to jump to quoted message"
            >
              <CornerDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="font-bold text-[10px] sm:text-xs block text-indigo-700 truncate">
                  @{message.replyTo.senderUsername}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-600 truncate block mt-0.5">
                  {message.replyTo.content}
                </span>
              </div>
            </div>
          )}

          {/* Bubble content */}
          <div
            onClick={() => !isEditing && setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`relative rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm transition-all cursor-pointer select-text min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word] ${
              isEmojiOnly
                ? 'bg-transparent shadow-none !p-1 text-3xl sm:text-4xl md:text-5xl'
                : isSender
                ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/10'
                : 'bg-slate-100/90 text-slate-900 rounded-bl-sm border border-slate-200/70 shadow-sm'
            }`}
          >
            {/* Deleted state */}
            {message.isDeleted ? (
              <p className="italic text-xs sm:text-sm text-slate-400">This message was deleted</p>
            ) : isEditing ? (
              <div className="space-y-2 py-1 min-w-[200px] sm:min-w-[220px]">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-slate-900 bg-white p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs px-2.5 py-1 text-white/80 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs px-3 py-1 bg-white text-indigo-700 font-bold rounded-lg shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Photo attachment if present */}
                {message.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-xl">
                    <img
                      src={message.imageUrl}
                      alt="Attachment"
                      onClick={() => setSelectedPhoto(message.imageUrl || null)}
                      className="max-h-56 sm:max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {/* Voice message player */}
                {message.type === 'voice' ? (
                  <VoiceMessagePlayer
                    mediaUrl={message.mediaUrl}
                    duration={message.duration}
                    isSender={isSender}
                  />
                ) : (
                  <div className="text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] font-normal tracking-[-0.01em]">
                    {renderMessageContent(message.content)}
                  </div>
                )}
              </>
            )}

            {/* Bubble Footer: Timestamp & status */}
            {!isEmojiOnly && !isEditing && (
              <div
                className={`flex items-center justify-end gap-1.5 text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-medium select-none ${
                  isSender ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                {message.editedAt && <span className="opacity-75">(edited)</span>}
                {message.expiresAt && (
                  <span title="Disappearing message">
                    <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-75 inline" />
                  </span>
                )}
                <span>{formatTime(message.createdAt)}</span>
                {isSender && (
                  <span title={message.status || 'sent'}>
                    <CheckCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-200 stroke-[2.2]" />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reaction Pills below message */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={`flex flex-wrap items-center gap-1.5 mt-1.5 z-10 ${
                isSender ? 'justify-end' : 'justify-start'
              }`}
            >
              {Object.entries(
                message.reactions.reduce<Record<string, { count: number; userReacted: boolean }>>(
                  (acc, rx) => {
                    if (!acc[rx.emoji]) {
                      acc[rx.emoji] = { count: 0, userReacted: false };
                    }
                    acc[rx.emoji].count += 1;
                    if (currentUser && rx.userId === currentUser.id) {
                      acc[rx.emoji].userReacted = true;
                    }
                    return acc;
                  },
                  {}
                )
              ).map(([emoji, data]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => reactToMessage(message.id, emoji)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-transform active:scale-95 cursor-pointer shadow-sm ${
                    data.userReacted
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={`${data.count} reaction${data.count > 1 ? 's' : ''}`}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="text-xs font-bold">{data.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Context actions toolbar on hover/touch */}
          <div
            className={`absolute -top-7 ${
              isSender ? 'right-0' : 'left-0'
            } ${
              isMobileMenuOpen
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none sm:group-hover/bubble:opacity-100 sm:group-hover/bubble:pointer-events-auto'
            } transition-opacity z-20`}
          >
            <MessageActionsMenu
              message={message}
              isSender={isSender}
              onStartEdit={() => {
                setIsEditing(true);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Attachments */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 cursor-pointer animate-in fade-in"
        >
          <img
            src={selectedPhoto}
            alt="Full view"
            className="max-w-[94vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
          <span className="text-white/80 text-xs mt-3 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs select-none">
            Tap anywhere to close
          </span>
        </div>
      )}
    </div>
  );
};
