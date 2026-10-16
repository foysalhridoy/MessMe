import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import type { UserProfile } from '../../types';
import { searchUsersByUsername } from '../../services/db';
import { useChat } from '../../context/ChatContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, startChatWithUser, showToast } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    if (!query.trim()) {
      setIsSearching(true);
      searchUsersByUsername('', currentUser.id)
        .then((allUsers) => {
          setResults(allUsers);
          setHasSearched(false);
        })
        .finally(() => setIsSearching(false));
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const matches = await searchUsersByUsername(query.trim(), currentUser.id);
        setResults(matches);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser, isOpen]);

  const handleStartChat = async (targetUser: UserProfile) => {
    try {
      await startChatWithUser(targetUser);
      onClose();
      setQuery('');
    } catch {
      showToast('Could not start conversation', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Conversation"
      description="Connect directly with anyone by searching their unique username."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by @username..."
            className="w-full pl-11 pr-11 py-3.5 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-medium"
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
        </div>

        {/* Results List */}
        <div className="min-h-[180px] max-h-80 overflow-y-auto space-y-2 pr-1">
          {results.length > 0 ? (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {query.trim() ? `Search Results (${results.length})` : `Registered Users (${results.length})`}
              </div>
              <div className="space-y-1.5">
                {results.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={user.displayName || user.username}
                        avatarUrl={user.avatarUrl}
                        seed={user.username}
                        size="md"
                        isOnline={user.isOnline}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {user.displayName || user.username}
                        </h4>
                        <p className="text-xs text-indigo-600 font-semibold truncate">@{user.username}</p>
                        {user.about && (
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-xs">
                            {user.about}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStartChat(user)}
                      icon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Message
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : hasSearched && !isSearching ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-3 border border-slate-100">
                <AlertCircle className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-base font-bold text-slate-800">No user found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Check the spelling of the username. Every username on MessMe is globally unique.
              </p>
            </div>
          ) : (
            <div className="text-center py-10 px-4 text-slate-400">
              <UserPlus className="w-10 h-10 mx-auto mb-2.5 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700">No other registered users yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Open another browser window or tab to create a second user identity and chat in real-time!
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
