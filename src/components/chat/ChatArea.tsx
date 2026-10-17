import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowDown, Sparkles, Calendar } from 'lucide-react';
import { useChat } from '../../context/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { SearchInChatBar } from './SearchInChatBar';
import { ConversationInfoDrawer } from './ConversationInfoDrawer';
import { Avatar } from '../common/Avatar';
import type { Message } from '../../types';

interface ChatAreaProps {
  onBackToSidebar?: () => void;
}

function getDateSeparatorLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === todayStr) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBackToSidebar }) => {
  const {
    currentUser,
    activeConversation,
    activeMessages,
    isLoadingMessages,
    typingMap,
  } = useChat();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadBelowCount, setUnreadBelowCount] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(activeMessages.length);

  const otherParticipant = activeConversation?.otherParticipant;
  const isOtherTyping = Boolean(
    activeConversation &&
    otherParticipant?.username &&
    typingMap[activeConversation.id] &&
    typingMap[activeConversation.id]?.toLowerCase() === otherParticipant.username.toLowerCase()
  );

  // Filter messages matching search query
  const matchingMessageIds = searchQuery.trim()
    ? activeMessages
        .filter((m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
        .map((m) => m.id)
    : [];

  // When opening a new conversation, reset overlays during render and jump to bottom
  const [prevActiveConvId, setPrevActiveConvId] = useState(activeConversation?.id);
  if (activeConversation?.id !== prevActiveConvId) {
    setPrevActiveConvId(activeConversation?.id);
    setUnreadBelowCount(0);
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsInfoOpen(false);
  }

  useEffect(() => {
    if (activeConversation?.id) {
      isNearBottomRef.current = true;
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [activeConversation?.id]);

  // Scroll to bottom on new message send or arrival (always scroll if self-sent or near bottom)
  useEffect(() => {
    const lastMsg = activeMessages[activeMessages.length - 1];
    const isSelfSender = Boolean(currentUser && lastMsg && lastMsg.senderId === currentUser.id);

    if ((isSelfSender || isNearBottomRef.current) && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: isSelfSender ? 'auto' : 'smooth',
      });
      setUnreadBelowCount(0);
      isNearBottomRef.current = true;
    } else if (activeMessages.length > prevMessagesCountRef.current) {
      // New message arrived while scrolled up
      setUnreadBelowCount((prev) => prev + (activeMessages.length - prevMessagesCountRef.current));
    }
    prevMessagesCountRef.current = activeMessages.length;
  }, [activeMessages, currentUser]);

  // Keep chat anchored to bottom when virtual keyboard opens or closes
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleViewportResize = () => {
      if (messagesContainerRef.current && isNearBottomRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
    if (isNearBottom) {
      setUnreadBelowCount(0);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setUnreadBelowCount(0);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-flash');
      setTimeout(() => {
        el.classList.remove('highlight-flash');
      }, 2400);
    }
  };

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matchingMessageIds.length;
    setCurrentMatchIdx(nextIdx);
    scrollToMessage(matchingMessageIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const prevIdx =
      (currentMatchIdx - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setCurrentMatchIdx(prevIdx);
    scrollToMessage(matchingMessageIds[prevIdx]);
  };

  // Group messages by date with clear, sticky frosted styling
  const renderDateSeparator = (dateString: string) => {
    const label = getDateSeparatorLabel(dateString);
    return (
      <div key={`sep-${dateString}`} className="flex items-center justify-center my-4 select-none sticky top-2 z-10">
        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-600 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>{label}</span>
        </span>
      </div>
    );
  };

  // 1. Empty State when no conversation is selected
  if (!activeConversation) {
    return (
      <main className="h-full flex-1 flex flex-col items-center justify-center p-8 bg-white select-none">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-md shadow-indigo-600/10">
          <MessageSquare className="w-10 h-10 fill-current" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          MessMe Conversations
        </h2>
        <p className="text-base text-slate-500 max-w-md text-center leading-relaxed mb-6 font-normal">
          Select a chat from the sidebar to start messaging, or search by username to connect with anyone instantly.
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/60 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Minimalist &bull; Username-First &bull; Real-Time</span>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full flex-1 flex overflow-hidden bg-white relative">
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Chat Header */}
        <ChatHeader
          onBack={onBackToSidebar}
          onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
          onToggleSearch={() => {
            setIsSearchOpen(!isSearchOpen);
            if (!isSearchOpen) setSearchQuery('');
          }}
          isSearchOpen={isSearchOpen}
        />

        {/* Search Bar in Chat */}
        {isSearchOpen && (
          <SearchInChatBar
            onSearch={(q) => {
              setSearchQuery(q);
              setCurrentMatchIdx(0);
              if (q.trim()) {
                const matches = activeMessages
                  .filter((m) =>
                    m.content.toLowerCase().includes(q.toLowerCase().trim())
                  )
                  .map((m) => m.id);
                if (matches.length > 0) {
                  scrollToMessage(matches[0]);
                }
              }
            }}
            onClose={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            matchCount={matchingMessageIds.length}
            currentMatchIndex={currentMatchIdx}
            onNextMatch={handleNextMatch}
            onPrevMatch={handlePrevMatch}
          />
        )}

        {/* Messages Stream - Anchored to bottom like WhatsApp & Telegram */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full px-2.5 sm:px-6 md:px-10 py-3 sm:py-6 chat-canvas-bg"
        >
          <div className="min-h-full flex flex-col justify-end">
            {/* Top flexible spacer: pushes messages to bottom when content is short */}
            <div className="flex-1 min-h-3" />

            {isLoadingMessages ? (
              <div className="py-20 flex items-center justify-center text-slate-400 text-sm font-medium">
                Loading conversation messages...
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100 shadow-xs">
                  <MessageSquare className="w-8 h-8 text-slate-300 stroke-[1.6]" />
                </div>
                <p className="text-base font-bold text-slate-800">No messages in this chat yet</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Say hello to @{activeConversation.otherParticipant.username} to start the conversation!
                </p>
              </div>
            ) : (
              activeMessages.map((msg: Message, index: number) => {
                const isSender = Boolean(currentUser && msg.senderId === currentUser.id);
                const prevMsg = activeMessages[index - 1];
                const nextMsg = activeMessages[index + 1];

                // Show date separator if day changed
                const showDate =
                  !prevMsg ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(prevMsg.createdAt).toDateString();

                // Group consecutive messages: show sender header if first of clump
                const showSenderHeader =
                  !prevMsg ||
                  prevMsg.senderId !== msg.senderId ||
                  showDate;

                const isFirstInClump = showSenderHeader;
                const isLastInClump =
                  !nextMsg ||
                  nextMsg.senderId !== msg.senderId ||
                  new Date(nextMsg.createdAt).toDateString() !==
                    new Date(msg.createdAt).toDateString();

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && renderDateSeparator(msg.createdAt)}
                    <MessageBubble
                      message={msg}
                      isSender={isSender}
                      showSenderHeader={showSenderHeader}
                      isFirstInClump={isFirstInClump}
                      isLastInClump={isLastInClump}
                      onScrollToMessage={scrollToMessage}
                    />
                  </React.Fragment>
                );
              })
            )}

            {/* Live Telegram-Style Typing Bubble */}
            {isOtherTyping && otherParticipant && (
              <div className="flex items-end gap-2 mt-2.5 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="w-7 sm:w-8 flex-shrink-0">
                  <Avatar
                    name={otherParticipant.displayName || otherParticipant.username}
                    avatarUrl={otherParticipant.avatarUrl}
                    seed={otherParticipant.username}
                    size="sm"
                  />
                </div>
                <div className="bg-white border border-slate-200/80 px-4 py-3 rounded-2xl rounded-tl-xs shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-3" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Scroll to Bottom Button with unread counter */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 sm:bottom-22 right-4 sm:right-8 z-20 w-11 h-11 rounded-full bg-white shadow-xl border border-slate-200/90 text-slate-700 hover:text-indigo-600 flex items-center justify-center transition-all animate-in fade-in zoom-in-95 cursor-pointer active:scale-95 group"
            title="Scroll to latest messages"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
            {unreadBelowCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadBelowCount}
              </span>
            )}
          </button>
        )}

        {/* Composer */}
        <MessageComposer key={activeConversation.id} />
      </div>

      {/* Conversation Info Panel Drawer */}
      <ConversationInfoDrawer
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </main>
  );
};
