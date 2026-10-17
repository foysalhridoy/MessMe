import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  X,
  Pin,
} from 'lucide-react';
import { useChat } from '../../context/useChat';
import { Avatar } from '../common/Avatar';
import { ConversationItem } from './ConversationItem';
import { NewChatModal } from './NewChatModal';
import { ProfileModal } from './ProfileModal';
import { BackendStatusModal } from './BackendStatusModal';

interface SidebarProps {
  className?: string;
  onSelectConversation?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onSelectConversation }) => {
  const { currentUser, conversations, activeConversation, setActiveConversationById } = useChat();
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'pinned'>('all');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBackendOpen, setIsBackendOpen] = useState(false);

  // Filter conversations by search and tab
  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (activeTab === 'unread') {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (activeTab === 'pinned') {
      list = list.filter((c) => c.isPinned);
    }

    if (!searchFilter.trim()) return list;
    const query = searchFilter.toLowerCase().trim();
    return list.filter((c) => {
      const name = (c.otherParticipant.displayName || '').toLowerCase();
      const username = (c.otherParticipant.username || '').toLowerCase();
      const lastText = (c.lastMessage?.content || '').toLowerCase();
      return name.includes(query) || username.includes(query) || lastText.includes(query);
    });
  }, [conversations, searchFilter, activeTab]);

  const pinnedList = useMemo(
    () => filteredConversations.filter((c) => c.isPinned),
    [filteredConversations]
  );
  const regularList = useMemo(
    () => filteredConversations.filter((c) => !c.isPinned),
    [filteredConversations]
  );

  const handleSelect = (id: string) => {
    setActiveConversationById(id);
    if (onSelectConversation) {
      onSelectConversation();
    }
  };

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  return (
    <aside
      className={`h-full flex flex-col bg-white border-r border-slate-200/90 select-none ${className}`}
    >
      {/* 1. Sidebar Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 flex-shrink-0">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none block">
              MessMee
            </span>
            {currentUser && (
              <p className="text-xs text-slate-500 font-medium leading-tight mt-1">
                @{currentUser.username}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
            title="Start new conversation"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </button>

          {currentUser && (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer"
              title="Profile and settings"
              aria-label="Your profile"
            >
              <Avatar
                name={currentUser.displayName || currentUser.username}
                avatarUrl={currentUser.avatarUrl}
                seed={currentUser.username}
                size="md"
                isOnline={true}
              />
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-3.5 pb-2 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search messages or people..."
            className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200/80 text-[13px] sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 transition-all font-medium"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'unread'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Unread</span>
            {totalUnreadCount > 0 && (
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {totalUnreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'pinned'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pinned
          </button>
        </div>
      </div>

      {/* 3. Conversations Stream */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3 py-1">
        {/* Pinned section if viewing 'all' tab */}
        {activeTab === 'all' && pinnedList.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Pin className="w-3.5 h-3.5 text-indigo-500" />
              <span>Pinned Conversations</span>
            </div>
            <div className="space-y-1">
              {pinnedList.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversation?.id === conv.id}
                  onSelect={() => handleSelect(conv.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular conversations */}
        <div>
          {activeTab === 'all' && pinnedList.length > 0 && regularList.length > 0 && (
            <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Recent Chats</span>
            </div>
          )}

          <div className="space-y-1">
            {(activeTab === 'all' ? regularList : filteredConversations).map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                onSelect={() => handleSelect(conv.id)}
              />
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredConversations.length === 0 && (
          <div className="text-center py-14 px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-sm">
              <MessageSquare className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-slate-800">No conversations yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
              {searchFilter
                ? `No results for "${searchFilter}"`
                : 'Connect with anyone directly by their unique username.'}
            </p>
            {!searchFilter && (
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                <span>Start New Chat</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Profile & Quick Status Footer */}
      {currentUser && (
        <div className="p-2.5 px-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group"
            title="Edit profile & picture"
          >
            <Avatar
              name={currentUser.displayName || currentUser.username}
              avatarUrl={currentUser.avatarUrl}
              seed={currentUser.username}
              size="sm"
              isOnline={true}
            />
            <div className="min-w-0">
              <span className="font-bold text-slate-800 text-xs truncate block group-hover:text-indigo-600 transition-colors">
                {currentUser.displayName || currentUser.username}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                @{currentUser.username}
              </span>
            </div>
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer hover:underline ml-2 flex-shrink-0"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Modals */}
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <BackendStatusModal isOpen={isBackendOpen} onClose={() => setIsBackendOpen(false)} />
    </aside>
  );
};
