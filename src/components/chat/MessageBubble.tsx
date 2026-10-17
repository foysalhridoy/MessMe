import { useState } from 'react';
import { CheckCheck, Check, CornerDownRight, ImageOff } from 'lucide-react';
import type { Message } from '../../types';
import { Avatar } from '../common/Avatar';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { MessageActionsMenu } from './MessageActionsMenu';
import { isOnlyEmojis } from '../../lib/emojis';
import { useChat } from '../../context/useChat';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  showSenderHeader: boolean;
  isFirstInClump?: boolean;
  isLastInClump?: boolean;
  onScrollToMessage: (id: string) => void;
}

function formatMessageTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSender,
  showSenderHeader,
  isFirstInClump = true,
  isLastInClump = true,
  onScrollToMessage,
}) => {
  const { currentUser, reactToMessage, editUserMessage } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isImageBroken, setIsImageBroken] = useState(false);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await editUserMessage(message.id, editContent.trim());
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reactToMessage(message.id, '❤️');
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
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
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const isEmojiOnly = message.type === 'text' && isOnlyEmojis(message.content);

  const imageSource = message.imageUrl || (
    message.type !== 'voice' && !message.duration && message.mediaUrl && (
      message.mediaUrl.startsWith('data:image') ||
      message.mediaUrl.startsWith('http') ||
      message.mediaUrl.startsWith('blob:') ||
      message.content === 'Shared an image'
    ) ? message.mediaUrl : null
  );

  // Clustered Telegram/WhatsApp bubble corners
  let cornerClass = '';
  if (isSender) {
    if (isFirstInClump && isLastInClump) cornerClass = 'bubble-sender-single';
    else if (isFirstInClump) cornerClass = 'bubble-sender-first';
    else if (isLastInClump) cornerClass = 'bubble-sender-last';
    else cornerClass = 'bubble-sender-mid';
  } else {
    if (isFirstInClump && isLastInClump) cornerClass = 'bubble-receiver-single';
    else if (isFirstInClump) cornerClass = 'bubble-receiver-first';
    else if (isLastInClump) cornerClass = 'bubble-receiver-last';
    else cornerClass = 'bubble-receiver-mid';
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col transition-all w-full min-w-0 max-w-full animate-message-in ${
        showSenderHeader ? 'mt-3 mb-0.5' : 'mt-0.5 mb-0.5'
      } ${isSender ? 'items-end' : 'items-start'}`}
    >
      {/* Sender name for received messages */}
      {showSenderHeader && !isSender && (
        <span className="text-[11px] sm:text-xs font-bold text-slate-600 ml-12 sm:ml-13 mb-1 select-none">
          {message.senderDisplayName && message.senderDisplayName.toLowerCase() !== 'user'
            ? message.senderDisplayName
            : (message.senderUsername && message.senderUsername.toLowerCase() !== 'user' ? `@${message.senderUsername}` : 'Friend')}
        </span>
      )}

      <div
        className={`flex items-end gap-3.5 sm:gap-4 max-w-[88%] sm:max-w-[78%] md:max-w-[68%] min-w-0 ${
          isSender ? 'ml-auto justify-end' : 'justify-start'
        }`}
      >
        {/* Avatar for received messages only - positioned with generous comfortable spacing */}
        {!isSender && (
          <div className="w-8 sm:w-9 flex-shrink-0 select-none pb-0.5 mr-1 sm:mr-1.5">
            {isLastInClump ? (
              <Avatar
                name={message.senderDisplayName || message.senderUsername}
                avatarUrl={message.senderAvatarUrl}
                seed={message.senderUsername}
                size="sm"
              />
            ) : (
              <div className="w-8 sm:w-9" />
            )}
          </div>
        )}

        {/* Message Container */}
        <div className="relative group/bubble flex flex-col min-w-0 max-w-full">
          {/* Double-click Telegram heart burst micro-animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <span className="text-4xl sm:text-5xl animate-heart-burst">❤️</span>
            </div>
          )}

          {/* Quoted Reply reference preview if message was a reply */}
          {message.replyTo && (
            <div
              onClick={() => onScrollToMessage(message.replyTo!.id)}
              className={`mb-1 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs cursor-pointer transition-all border flex items-center gap-2 max-w-full min-w-0 overflow-hidden shadow-xs ${
                isSender
                  ? 'bg-indigo-500/20 border-indigo-400/30 text-white hover:bg-indigo-500/30'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
              }`}
              title="Click to jump to quoted message"
            >
              <CornerDownRight className={`w-3.5 h-3.5 flex-shrink-0 ${isSender ? 'text-indigo-200' : 'text-indigo-600'}`} />
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className={`font-bold text-[10px] sm:text-xs block truncate ${isSender ? 'text-indigo-100' : 'text-indigo-700'}`}>
                  @{message.replyTo.senderUsername}
                </span>
                <span className={`text-[11px] sm:text-xs truncate block mt-0.5 ${isSender ? 'text-indigo-50/90' : 'text-slate-600'}`}>
                  {message.replyTo.content}
                </span>
              </div>
            </div>
          )}

          {/* Bubble content */}
          <div
            onClick={() => !isEditing && setIsMobileMenuOpen(!isMobileMenuOpen)}
            onDoubleClick={handleDoubleClick}
            className={`relative px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all select-text min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word] ${
              isEmojiOnly
                ? 'bg-transparent shadow-none !p-1 text-3xl sm:text-4xl md:text-5xl'
                : isSender
                ? `bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-[0_1px_3px_rgba(79,70,229,0.25)] ${cornerClass}`
                : `bg-white text-slate-900 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${cornerClass}`
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
                    className="text-xs px-2.5 py-1 text-white/80 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs px-3 py-1 bg-white text-indigo-700 font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Photo attachment if present */}
                {imageSource && (
                  <div className="mb-2 max-w-sm sm:max-w-md overflow-hidden rounded-2xl bg-black/5 shadow-xs">
                    {isImageBroken ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-100 rounded-2xl">
                        <ImageOff className="w-4 h-4 text-slate-400" />
                        <span>Image unavailable</span>
                      </div>
                    ) : (
                      <img
                        src={imageSource}
                        alt="Attachment"
                        onError={() => setIsImageBroken(true)}
                        onLoad={() => {
                          window.dispatchEvent(new CustomEvent('messme:scroll-to-bottom'));
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(imageSource);
                        }}
                        className="max-h-72 sm:max-h-96 w-auto max-w-full object-cover rounded-2xl cursor-pointer hover:opacity-95 transition-opacity block"
                      />
                    )}
                  </div>
                )}

                {/* Voice message player or text content */}
                {message.type === 'voice' ? (
                  <VoiceMessagePlayer
                    mediaUrl={message.mediaUrl}
                    duration={message.duration}
                    isSender={isSender}
                  />
                ) : (
                  !(imageSource && message.content === 'Shared an image') && message.content && (
                    <div className="text-[13.5px] sm:text-[14.5px] md:text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] font-normal tracking-[-0.01em]">
                      {renderMessageContent(message.content)}
                    </div>
                  )
                )}
              </>
            )}

            {/* Bubble Footer: Timestamp & Telegram double checkmarks */}
            {!isEmojiOnly && !isEditing && (
              <div
                className={`flex items-center justify-end gap-1.5 text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-medium select-none ${
                  isSender ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                {message.editedAt && <span className="opacity-75 text-[9px] sm:text-[10px]">(edited)</span>}
                <span>{formatMessageTime(message.createdAt)}</span>
                {isSender && (
                  <span title={message.status === 'read' ? 'Seen' : 'Sent'} className="inline-flex items-center ml-0.5">
                    {message.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-300 stroke-[2.6]" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-indigo-200 stroke-[2.2]" />
                    )}
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
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-transform active:scale-95 cursor-pointer shadow-xs ${
                    data.userReacted
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={`${data.count} reaction${data.count > 1 ? 's' : ''}`}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="text-[11px] font-bold">{data.count}</span>
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
                setEditContent(message.content);
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 cursor-pointer animate-in fade-in"
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
