import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Conversation, DisappearingDuration, Message, SessionData, ToastMessage, UserProfile } from '../types';
import {
  clearSession,
  generateSessionToken,
  getSavedProfile,
  getSavedSession,
  saveSessionAndProfile,
} from '../lib/identity';
import {
  clearConversationMessages,
  deleteMessage,
  editMessage,
  fetchMessages,
  fetchUserConversations,
  getOrCreateConversation,
  registerUserProfile,
  sendMessage,
  subscribeToRealtimeEvents,
  toggleMessageReaction,
  toggleMuteConversation,
  togglePinConversation,
  broadcastTypingStatus,
  updateUserProfileInStorage,
  setConversationDisappearingDuration,
  purgeExpiredMessages,
  getStoredBlockedUserIds,
  blockUserInStorage,
  unblockUserInStorage,
} from '../services/db';
import { uploadVoiceAudio } from '../lib/audio';

interface ChatContextType {
  currentUser: UserProfile | null;
  session: SessionData | null;
  isLoadingAuth: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: Message[];
  isLoadingMessages: boolean;
  typingMap: Record<string, string>; // conversationId -> typing username
  replyingTo: Message | null;
  searchQueryInChat: string;
  isSearchInChatOpen: boolean;
  toasts: ToastMessage[];
  drafts: Record<string, string>;
  blockedUserIds: string[];

  // Actions
  onboardUser: (username: string, displayName?: string, avatarUrl?: string) => Promise<boolean>;
  restoreSessionWithToken: (sessionToken: string, username: string) => Promise<boolean>;
  logoutUser: () => void;
  setActiveConversationById: (convId: string) => void;
  startChatWithUser: (user: UserProfile) => Promise<Conversation>;
  sendText: (content: string) => Promise<void>;
  sendVoice: (blob: Blob, duration: number) => Promise<void>;
  sendImageMessage: (imageDataUrl: string, caption?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  startReply: (msg: Message) => void;
  cancelReply: () => void;
  editUserMessage: (messageId: string, content: string) => Promise<void>;
  deleteUserMessage: (messageId: string) => Promise<void>;
  togglePin: (convId: string) => Promise<void>;
  toggleMute: (convId: string) => Promise<void>;
  clearConversation: (convId: string) => Promise<void>;
  setDisappearingDuration: (convId: string, duration: DisappearingDuration) => Promise<void>;
  purgeStorageNow: (convId?: string) => Promise<number>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  updateCurrentUserProfile: (displayName: string, avatarUrl?: string, about?: string) => Promise<void>;
  setSearchQueryInChat: (query: string) => void;
  setIsSearchInChatOpen: (open: boolean) => void;
  setDraftForConversation: (convId: string, draft: string) => void;
  showToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;
  notifyTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searchQueryInChat, setSearchQueryInChat] = useState('');
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Restore identity from local storage on initial mount
  useEffect(() => {
    const savedSession = getSavedSession();
    const savedProfile = getSavedProfile();

    if (savedSession && savedProfile) {
      setSession(savedSession);
      setCurrentUser(savedProfile);
    }
    setIsLoadingAuth(false);
  }, []);

  // 2. Load conversations when current user is available
  const loadConversations = useCallback(async (userId: string) => {
    const convs = await fetchUserConversations(userId);
    setConversations(convs);
    return convs;
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
      loadConversations(currentUser.id).then((convs) => {
        if (convs.length > 0 && !activeConversation) {
          // Select first conversation by default on desktop
          if (window.innerWidth >= 768) {
            setActiveConversation(convs[0]);
          }
        }
      });
    } else {
      setBlockedUserIds([]);
      setConversations([]);
      setActiveConversation(null);
      setActiveMessages([]);
    }
  }, [currentUser?.id, loadConversations]);

  // 3. Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setActiveMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    fetchMessages(activeConversation.id).then((msgs) => {
      setActiveMessages(msgs);
      setIsLoadingMessages(false);
    });
  }, [activeConversation?.id]);

  // 4. Realtime events listener
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeEvents((payload) => {
      if (payload.type === 'NEW_MESSAGE' && payload.message) {
        const msg = payload.message;

        // If message belongs to active conversation, append
        if (activeConversation && msg.conversationId === activeConversation.id) {
          setActiveMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }

        // Update conversation preview and sort
        setConversations((prev) => {
          return prev.map((c) => {
            if (c.id === msg.conversationId) {
              const isCurrentChat = activeConversation?.id === c.id;
              return {
                ...c,
                lastMessage: msg,
                unreadCount: isCurrentChat ? 0 : c.unreadCount + 1,
                updatedAt: msg.createdAt,
              };
            }
            return c;
          });
        });
      } else if (payload.type === 'REACTION_UPDATE' && payload.message) {
        const updatedMsg = payload.message;
        if (activeConversation && updatedMsg.conversationId === activeConversation.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      } else if (payload.type === 'EDIT_MESSAGE' && payload.message) {
        const editedMsg = payload.message;
        if (activeConversation && editedMsg.conversationId === activeConversation.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === editedMsg.id ? editedMsg : m))
          );
        }
      } else if (payload.type === 'DELETE_MESSAGE' && payload.message) {
        const deletedMsg = payload.message;
        if (activeConversation && deletedMsg.conversationId === activeConversation.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === deletedMsg.id ? deletedMsg : m))
          );
        }
      } else if (payload.type === 'TYPING' && payload.conversationId) {
        const { conversationId, isTyping, senderUsername } = payload;
        setTypingMap((prev) => {
          if (isTyping && senderUsername) {
            return { ...prev, [conversationId]: senderUsername };
          }
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      } else if (payload.type === 'PROFILE_UPDATE' && payload.profile) {
        const updatedUser = payload.profile;
        setConversations((prev) =>
          prev.map((c) => {
            const hasUser =
              c.otherParticipant.userId === updatedUser.id ||
              c.participants.some((p) => p.userId === updatedUser.id);
            if (!hasUser) return c;
            return {
              ...c,
              otherParticipant:
                c.otherParticipant.userId === updatedUser.id
                  ? {
                      ...c.otherParticipant,
                      displayName: updatedUser.displayName,
                      avatarUrl: updatedUser.avatarUrl,
                      about: updatedUser.about,
                    }
                  : c.otherParticipant,
              participants: c.participants.map((p) =>
                p.userId === updatedUser.id
                  ? {
                      ...p,
                      displayName: updatedUser.displayName,
                      avatarUrl: updatedUser.avatarUrl,
                      about: updatedUser.about,
                    }
                  : p
              ),
            };
          })
        );

        setActiveConversation((prev) => {
          if (!prev || prev.otherParticipant.userId !== updatedUser.id) return prev;
          return {
            ...prev,
            otherParticipant: {
              ...prev.otherParticipant,
              displayName: updatedUser.displayName,
              avatarUrl: updatedUser.avatarUrl,
              about: updatedUser.about,
            },
          };
        });

        setActiveMessages((prev) =>
          prev.map((m) =>
            m.senderId === updatedUser.id
              ? {
                  ...m,
                  senderDisplayName: updatedUser.displayName,
                  senderAvatarUrl: updatedUser.avatarUrl,
                }
              : m
          )
        );
      } else if (payload.type === 'DISAPPEARING_DURATION_UPDATE' && payload.conversationId) {
        const { conversationId, disappearingDuration } = payload;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, disappearingDuration } : c
          )
        );
        setActiveConversation((prev) =>
          prev && prev.id === conversationId
            ? { ...prev, disappearingDuration }
            : prev
        );
      } else if (payload.type === 'MESSAGES_PURGED' && payload.conversationId) {
        if (activeConversation && activeConversation.id === payload.conversationId) {
          fetchMessages(activeConversation.id).then((fresh) => setActiveMessages(fresh));
        }
      } else if (payload.type === 'BLOCK_STATUS_UPDATE') {
        if (currentUser?.id) {
          setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
        }
      }
    });

    return unsubscribe;
  }, [activeConversation, currentUser?.id]);

  // Periodic background storage cleaner: automatically purges expired messages to free storage
  useEffect(() => {
    const cleanerInterval = window.setInterval(async () => {
      const { purgedCount } = await purgeExpiredMessages();
      if (purgedCount > 0 && activeConversation) {
        const fresh = await fetchMessages(activeConversation.id);
        setActiveMessages(fresh);
      }
    }, 60000); // Check every minute

    return () => clearInterval(cleanerInterval);
  }, [activeConversation?.id]);

  // Onboard new user with unique username and optional profile photo
  const onboardUser = async (username: string, displayName?: string, avatarUrl?: string): Promise<boolean> => {
    try {
      const sessionToken = generateSessionToken();
      const profile = await registerUserProfile(username, sessionToken, displayName, avatarUrl);
      const newSession: SessionData = {
        userId: profile.id,
        username: profile.username,
        sessionToken,
        createdAt: new Date().toISOString(),
      };

      saveSessionAndProfile(newSession, profile);
      setSession(newSession);
      setCurrentUser(profile);
      showToast(`Welcome to MessMe, @${profile.username}!`, 'success', 'Identity Established');
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
      return false;
    }
  };

  // Restore session using backup token
  const restoreSessionWithToken = async (sessionToken: string, username: string): Promise<boolean> => {
    // In our architecture, the session token matches stored credentials
    const cleanUser = username.trim().toLowerCase();
    const cleanToken = sessionToken.trim();

    if (!cleanUser || !cleanToken) {
      showToast('Please provide both username and session backup key.', 'warning');
      return false;
    }

    const newProfile: UserProfile = {
      id: 'usr_restored_' + cleanUser,
      username: cleanUser,
      displayName: cleanUser,
      createdAt: new Date().toISOString(),
      isOnline: true,
    };

    const newSession: SessionData = {
      userId: newProfile.id,
      username: cleanUser,
      sessionToken: cleanToken,
      createdAt: new Date().toISOString(),
    };

    saveSessionAndProfile(newSession, newProfile);
    setSession(newSession);
    setCurrentUser(newProfile);
    showToast(`Identity for @${cleanUser} restored successfully.`, 'success', 'Session Restored');
    return true;
  };

  const logoutUser = () => {
    clearSession();
    setSession(null);
    setCurrentUser(null);
    setActiveConversation(null);
    setActiveMessages([]);
    showToast('Your browser session was cleared.', 'info');
  };

  const setActiveConversationById = (convId: string) => {
    const found = conversations.find((c) => c.id === convId);
    if (found) {
      // Mark as read
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
      setActiveConversation(found);
      setReplyingTo(null);
      setIsSearchInChatOpen(false);
      setSearchQueryInChat('');
    }
  };

  const startChatWithUser = async (targetUser: UserProfile): Promise<Conversation> => {
    if (!currentUser) throw new Error('Not logged in');
    const conv = await getOrCreateConversation(currentUser, targetUser);
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    setActiveConversation(conv);
    return conv;
  };

  const sendText = async (content: string) => {
    if (!currentUser || !activeConversation) return;
    const clean = content.trim();
    if (!clean) return;

    const replyRef = replyingTo
      ? {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          senderUsername: replyingTo.senderUsername,
          senderDisplayName: replyingTo.senderDisplayName,
          content: replyingTo.content,
          type: replyingTo.type,
        }
      : undefined;

    setReplyingTo(null);
    await sendMessage(activeConversation.id, currentUser, clean, 'text', undefined, undefined, replyRef);
  };

  const sendVoice = async (blob: Blob, duration: number) => {
    if (!currentUser || !activeConversation) return;

    try {
      const mediaUrl = await uploadVoiceAudio(blob, currentUser.id);
      await sendMessage(
        activeConversation.id,
        currentUser,
        'Voice message',
        'voice',
        mediaUrl,
        duration,
        undefined
      );
      showToast('Voice message sent', 'success');
    } catch {
      showToast('Failed to send voice message', 'error');
    }
  };

  const sendImageMessage = async (imageDataUrl: string, caption = '') => {
    if (!currentUser || !activeConversation) return;
    try {
      await sendMessage(
        activeConversation.id,
        currentUser,
        caption || 'Shared an image',
        'text',
        undefined,
        undefined,
        undefined,
        imageDataUrl
      );
      showToast('Photo sent', 'success');
    } catch {
      showToast('Failed to send photo', 'error');
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeConversation) return;
    await toggleMessageReaction(activeConversation.id, messageId, currentUser, emoji);
  };

  const startReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const editUserMessage = async (messageId: string, content: string) => {
    if (!currentUser || !activeConversation) return;
    const updated = await editMessage(activeConversation.id, messageId, currentUser.id, content);
    if (!updated) {
      showToast('Could not edit this message', 'error');
    }
  };

  const deleteUserMessage = async (messageId: string) => {
    if (!currentUser || !activeConversation) return;
    const success = await deleteMessage(activeConversation.id, messageId, currentUser.id);
    if (success) {
      showToast('Message deleted', 'info');
    } else {
      showToast('Could not delete message', 'error');
    }
  };

  const togglePin = async (convId: string) => {
    if (!currentUser) return;
    const updated = await togglePinConversation(currentUser.id, convId);
    setConversations([...updated]);
  };

  const toggleMute = async (convId: string) => {
    if (!currentUser) return;
    const updated = await toggleMuteConversation(currentUser.id, convId);
    setConversations([...updated]);
  };

  const clearConversation = async (convId: string) => {
    if (!currentUser) return;
    await clearConversationMessages(currentUser.id, convId);
    if (activeConversation?.id === convId) {
      setActiveMessages([]);
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c))
    );
    showToast('Conversation cleared', 'info');
  };

  const setDisappearingDuration = async (convId: string, duration: DisappearingDuration) => {
    if (!currentUser) return;
    const updated = await setConversationDisappearingDuration(currentUser.id, convId, duration);
    if (updated) {
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, disappearingDuration: duration } : c))
      );
      setActiveConversation((prev) =>
        prev && prev.id === convId ? { ...prev, disappearingDuration: duration } : prev
      );

      // Purge any messages exceeding duration immediately and refresh active messages
      const { remainingMessages, purgedCount } = await purgeExpiredMessages(convId);
      if (activeConversation?.id === convId) {
        setActiveMessages(remainingMessages);
      }

      showToast(
        duration === 'off'
          ? 'Disappearing messages turned off'
          : `Messages will auto-delete after ${duration}${
              purgedCount > 0 ? ` (${purgedCount} expired messages cleaned)` : ''
            }`,
        'info',
        'Storage Auto-Clean'
      );
    }
  };

  const purgeStorageNow = async (convId?: string): Promise<number> => {
    const { purgedCount, remainingMessages } = await purgeExpiredMessages(convId);
    if (convId && activeConversation?.id === convId) {
      setActiveMessages(remainingMessages);
    } else if (activeConversation) {
      const fresh = await fetchMessages(activeConversation.id);
      setActiveMessages(fresh);
    }
    if (purgedCount > 0) {
      showToast(`${purgedCount} expired messages purged to save storage.`, 'success', 'Storage Saved');
    } else {
      showToast('Storage is clean. No expired messages.', 'info', 'Storage Check');
    }
    return purgedCount;
  };

  const blockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    blockUserInStorage(currentUser.id, targetUserId);
    setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
    showToast('User has been blocked', 'info');
  };

  const unblockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    unblockUserInStorage(currentUser.id, targetUserId);
    setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
    showToast('User has been unblocked', 'success');
  };

  const isBlocked = (userId: string) => {
    return blockedUserIds.includes(userId);
  };

  const updateCurrentUserProfile = async (displayName: string, avatarUrl?: string, about?: string) => {
    if (!currentUser || !session) return;
    const updated: UserProfile = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.username,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : currentUser.avatarUrl,
      about: about !== undefined ? about : currentUser.about,
    };
    saveSessionAndProfile(session, updated);
    setCurrentUser(updated);
    await updateUserProfileInStorage(updated);

    // Refresh conversation list participant info
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.userId === updated.id
            ? { ...p, displayName: updated.displayName, avatarUrl: updated.avatarUrl, about: updated.about }
            : p
        ),
      }))
    );

    // Refresh currently visible active messages
    setActiveMessages((prev) =>
      prev.map((m) =>
        m.senderId === updated.id
          ? {
              ...m,
              senderDisplayName: updated.displayName,
              senderAvatarUrl: updated.avatarUrl,
            }
          : m
      )
    );

    showToast('Profile updated successfully', 'success');
  };

  const setDraftForConversation = (convId: string, draft: string) => {
    setDrafts((prev) => ({ ...prev, [convId]: draft }));
  };

  const notifyTyping = (isTyping: boolean) => {
    if (!currentUser || !activeConversation) return;
    broadcastTypingStatus(activeConversation.id, currentUser, isTyping);
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        session,
        isLoadingAuth,
        conversations,
        activeConversation,
        activeMessages,
        isLoadingMessages,
        typingMap,
        replyingTo,
        searchQueryInChat,
        isSearchInChatOpen,
        toasts,
        drafts,
        blockedUserIds,
        onboardUser,
        restoreSessionWithToken,
        logoutUser,
        setActiveConversationById,
        startChatWithUser,
        sendText,
        sendVoice,
        sendImageMessage,
        reactToMessage,
        startReply,
        cancelReply,
        editUserMessage,
        deleteUserMessage,
        togglePin,
        toggleMute,
        clearConversation,
        setDisappearingDuration,
        purgeStorageNow,
        blockUser,
        unblockUser,
        isBlocked,
        updateCurrentUserProfile,
        setSearchQueryInChat,
        setIsSearchInChatOpen,
        setDraftForConversation,
        showToast,
        removeToast,
        notifyTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
