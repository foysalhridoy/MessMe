import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowDown, Sparkles, Calendar } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { SearchInChatBar } from './SearchInChatBar';
import { ConversationInfoDrawer } from './ConversationInfoDrawer';
import { DisappearingMessagesBanner } from './DisappearingMessagesBanner';
import type { Message } from '../../types';

interface ChatAreaProps {
  onBackToSidebar?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBackToSidebar }) => {
  const {
    currentUser,
    activeConversation,
    activeMessages,
    isLoadingMessages,
  } = useChat();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Filter messages matching search query
  const matchingMessageIds = searchQuery.trim()
    ? activeMessages
        .filter((m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
        .map((m) => m.id)
    : [];

  // Scroll to bottom on initial message load or new message (if near bottom)
  useEffect(() => {
    if (isNearBottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeMessages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
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

  // Group messages by date with clear, prominent styling
  const renderDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label = date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });

    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    }

    return (
      <div key={`sep-${dateString}`} className="flex items-center justify-center my-6 select-none">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100/90 px-3.5 py-1 rounded-full border border-slate-200/60 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
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

        {/* Ephemeral Disappearing Messages Reminder Banner */}
        <DisappearingMessagesBanner />

        {/* Messages Stream */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full px-2.5 sm:px-6 md:px-10 py-3 sm:py-6 space-y-1 chat-canvas-bg"
        >
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
              Loading conversation messages...
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
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

              return (
                <React.Fragment key={msg.id}>
                  {showDate && renderDateSeparator(msg.createdAt)}
                  <MessageBubble
                    message={msg}
                    isSender={isSender}
                    showSenderHeader={showSenderHeader}
                    onScrollToMessage={scrollToMessage}
                  />
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 sm:bottom-22 right-4 sm:right-8 z-20 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-200 text-slate-700 hover:text-indigo-600 flex items-center justify-center transition-all animate-in fade-in zoom-in-95 cursor-pointer active:scale-95"
            title="Scroll to latest messages"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Composer */}
        <MessageComposer />
      </div>

      {/* Conversation Info Panel Drawer */}
      <ConversationInfoDrawer
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </main>
  );
};
